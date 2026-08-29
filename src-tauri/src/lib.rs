use serde::Serialize;
use std::process::Command;
use std::sync::Mutex;
use sysinfo::System;

#[derive(Clone, Copy)]
enum GpuBackend {
    Nvidia,
    Amd,
}

struct AppState {
    sys: Mutex<System>,
    gpu_backend: Mutex<Option<Option<GpuBackend>>>,
}

#[derive(Serialize, Clone)]
struct GpuStats {
    name: String,
    util_percent: f32,
    mem_used_mb: u64,
    mem_total_mb: u64,
    temp_c: Option<f32>,
}

#[derive(Serialize, Clone)]
struct SystemStats {
    cpu_percent: f32,
    per_core_percent: Vec<f32>,
    mem_used_mb: u64,
    mem_total_mb: u64,
    ollama_cpu_percent: f32,
    ollama_mem_mb: u64,
    ollama_running: bool,
    gpus: Vec<GpuStats>,
}

fn detect_gpu_backend() -> Option<GpuBackend> {
    if Command::new("nvidia-smi")
        .args(["--query-gpu=name", "--format=csv,noheader"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        return Some(GpuBackend::Nvidia);
    }
    if Command::new("rocm-smi")
        .arg("--showuse")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        return Some(GpuBackend::Amd);
    }
    None
}

fn nvidia_gpu_stats() -> Vec<GpuStats> {
    let Ok(output) = Command::new("nvidia-smi")
        .args([
            "--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu",
            "--format=csv,noheader,nounits",
        ])
        .output()
    else {
        return vec![];
    };
    if !output.status.success() {
        return vec![];
    }
    let text = String::from_utf8_lossy(&output.stdout);
    text.lines()
        .filter_map(|line| {
            let parts: Vec<&str> = line.split(',').map(|s| s.trim()).collect();
            if parts.len() < 5 {
                return None;
            }
            Some(GpuStats {
                name: parts[0].to_string(),
                util_percent: parts[1].parse().unwrap_or(0.0),
                mem_used_mb: parts[2].parse().unwrap_or(0),
                mem_total_mb: parts[3].parse().unwrap_or(0),
                temp_c: parts[4].parse().ok(),
            })
        })
        .collect()
}

fn amd_gpu_stats() -> Vec<GpuStats> {
    let Ok(output) = Command::new("rocm-smi")
        .args([
            "--showuse",
            "--showmeminfo",
            "vram",
            "--showtemp",
            "--showproductname",
            "--json",
        ])
        .output()
    else {
        return vec![];
    };
    if !output.status.success() {
        return vec![];
    }
    let Ok(json) = serde_json::from_slice::<serde_json::Value>(&output.stdout) else {
        return vec![];
    };
    let Some(obj) = json.as_object() else {
        return vec![];
    };

    fn field_f32(v: &serde_json::Value, key: &str) -> Option<f32> {
        v.get(key)?.as_str()?.trim_end_matches('%').trim().parse().ok()
    }
    fn field_u64(v: &serde_json::Value, key: &str) -> Option<u64> {
        v.get(key)?.as_str()?.trim().parse().ok()
    }

    obj.iter()
        .filter(|(k, _)| k.starts_with("card"))
        .map(|(_, v)| {
            let mem_used_b = field_u64(v, "VRAM Total Used Memory (B)").unwrap_or(0);
            let mem_total_b = field_u64(v, "VRAM Total Memory (B)").unwrap_or(0);
            GpuStats {
                name: v
                    .get("Card series")
                    .and_then(|x| x.as_str())
                    .unwrap_or("AMD GPU")
                    .to_string(),
                util_percent: field_f32(v, "GPU use (%)").unwrap_or(0.0),
                mem_used_mb: mem_used_b / 1024 / 1024,
                mem_total_mb: mem_total_b / 1024 / 1024,
                temp_c: field_f32(v, "Temperature (Sensor edge) (C)"),
            }
        })
        .collect()
}

#[tauri::command]
fn get_system_stats(state: tauri::State<AppState>) -> SystemStats {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_cpu_usage();
    sys.refresh_memory();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let cpu_percent = sys.global_cpu_usage();
    let per_core_percent: Vec<f32> = sys.cpus().iter().map(|c| c.cpu_usage()).collect();
    let mem_used_mb = sys.used_memory() / 1024 / 1024;
    let mem_total_mb = sys.total_memory() / 1024 / 1024;

    let mut ollama_cpu_percent = 0.0f32;
    let mut ollama_mem_mb = 0u64;
    let mut ollama_running = false;

    for process in sys.processes().values() {
        let name = process.name().to_string_lossy().to_lowercase();
        if name == "ollama" {
            ollama_running = true;
            ollama_cpu_percent += process.cpu_usage();
            ollama_mem_mb += process.memory() / 1024 / 1024;
        }
    }

    let mut backend_cache = state.gpu_backend.lock().unwrap();
    let backend = *backend_cache.get_or_insert_with(detect_gpu_backend);
    drop(backend_cache);
    let gpus = match backend {
        Some(GpuBackend::Nvidia) => nvidia_gpu_stats(),
        Some(GpuBackend::Amd) => amd_gpu_stats(),
        None => vec![],
    };

    SystemStats {
        cpu_percent,
        per_core_percent,
        mem_used_mb,
        mem_total_mb,
        ollama_cpu_percent,
        ollama_mem_mb,
        ollama_running,
        gpus,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            sys: Mutex::new(System::new_all()),
            gpu_backend: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![get_system_stats])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

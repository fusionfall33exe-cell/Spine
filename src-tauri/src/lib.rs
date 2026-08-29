use serde::Serialize;
use std::sync::Mutex;
use sysinfo::System;

struct AppState {
    sys: Mutex<System>,
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

    SystemStats {
        cpu_percent,
        per_core_percent,
        mem_used_mb,
        mem_total_mb,
        ollama_cpu_percent,
        ollama_mem_mb,
        ollama_running,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            sys: Mutex::new(System::new_all()),
        })
        .invoke_handler(tauri::generate_handler![get_system_stats])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

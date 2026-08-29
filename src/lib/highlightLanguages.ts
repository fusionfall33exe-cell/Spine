import bash from "highlight.js/lib/languages/bash";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import rust from "highlight.js/lib/languages/rust";
import go from "highlight.js/lib/languages/go";
import sql from "highlight.js/lib/languages/sql";
import powershell from "highlight.js/lib/languages/powershell";
import xml from "highlight.js/lib/languages/xml";
import diff from "highlight.js/lib/languages/diff";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import ini from "highlight.js/lib/languages/ini";
import markdown from "highlight.js/lib/languages/markdown";
import plaintext from "highlight.js/lib/languages/plaintext";

// Curated subset instead of rehype-highlight's default ~37-language bundle —
// keeps only what's realistic for a security-research / dev chat tool.
export const highlightLanguages = {
  bash,
  sh: bash,
  shell: bash,
  zsh: bash,
  python,
  py: python,
  javascript,
  js: javascript,
  typescript,
  ts: typescript,
  json,
  yaml,
  yml: yaml,
  c,
  cpp,
  "c++": cpp,
  rust,
  rs: rust,
  go,
  golang: go,
  sql,
  powershell,
  ps1: powershell,
  xml,
  html: xml,
  diff,
  patch: diff,
  dockerfile,
  docker: dockerfile,
  ini,
  toml: ini,
  markdown,
  md: markdown,
  plaintext,
  text: plaintext,
};

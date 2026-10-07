# Architecture Rules & Constraints

1. **Decoupled Client-Server**:
   - The React frontend runs in WebView2 and must communicate with the Python backend solely through HTTP REST and SSE APIs (`127.0.0.1:8000`).
   - Frontend must never attempt to invoke direct Python modules or bypass the API layer.
2. **Crash-Proof Telemetry**:
   - `SystemService` must handle missing hardware, missing graphics drivers, or non-NVIDIA GPUs gracefully without raising unhandled exceptions.
3. **No Hardcoded Absolute Paths**:
   - All filesystem paths must resolve dynamically relative to the application workspace or configured storage environment variables.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
async fn toggle_always_on_top(window: tauri::Window, enable: bool) -> Result<bool, String> {
    window.set_always_on_top(enable).map_err(|e| e.to_string())?;
    Ok(enable)
}

#[tauri::command]
async fn set_mini_pip_mode(window: tauri::Window, mini: bool) -> Result<bool, String> {
    if mini {
        let _ = window.set_always_on_top(true);
        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: 380.0, height: 360.0 }));
    } else {
        let _ = window.set_always_on_top(false);
        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: 1280.0, height: 850.0 }));
    }
    Ok(mini)
}

#[tauri::command]
async fn minimize_window(window: tauri::Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn close_window(window: tauri::Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![toggle_always_on_top, set_mini_pip_mode, minimize_window, close_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

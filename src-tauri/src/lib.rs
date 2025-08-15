mod models;
mod crypto;
mod storage;
mod commands;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // 记忆条目相关命令
            create_memory_entry,
            update_memory_entry,
            delete_memory_entry,
            get_memory_entry,
            get_all_memory_entries,
            search_memory_entries,

            // 加密相关命令
            encrypt_data,
            decrypt_data,
            validate_password_strength,


            // 拾梦回响相关命令
            get_random_memory,

            // 文件操作命令
            backup_data,

            // 初始化命令
            initialize_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

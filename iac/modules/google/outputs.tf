# Firebase Web App client config - consumed by the SPA.
output "firebase_config" {
  value = {
    api_key             = data.google_firebase_web_app_config.default.api_key
    auth_domain         = data.google_firebase_web_app_config.default.auth_domain
    project_id          = var.project_id
    storage_bucket      = data.google_firebase_web_app_config.default.storage_bucket
    messaging_sender_id = data.google_firebase_web_app_config.default.messaging_sender_id
    app_id              = google_firebase_web_app.default.app_id
  }
  sensitive = true
}

# Admin SDK key - the full JSON the backend initializes the Admin SDK with.
output "firebase_admin_service_account_key" {
  value     = base64decode(google_service_account_key.firebase_admin.private_key)
  sensitive = true
}

output "firebase_admin_project_id" {
  value = local.firebase_admin_key.project_id
}

output "firebase_admin_client_email" {
  value = local.firebase_admin_key.client_email
}

output "firebase_admin_private_key" {
  value     = local.firebase_admin_key.private_key
  sensitive = true
}

resource "google_project" "default" {
  count = var.billing_account_id != "" ? 1 : 0

  provider        = google-beta
  project_id      = var.project_id
  name            = var.project_id
  billing_account = var.billing_account_id
}

resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id

  depends_on = [google_project.default]
}

resource "google_firebase_web_app" "default" {
  provider     = google-beta
  project      = var.project_id
  display_name = var.app_display_name

  depends_on = [google_firebase_project.default]
}

data "google_firebase_web_app_config" "default" {
  provider   = google-beta
  web_app_id = google_firebase_web_app.default.app_id
}

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

# Service account the backend uses as the Firebase Admin SDK credential.
resource "google_service_account" "firebase_admin" {
  provider     = google-beta
  project      = var.project_id
  account_id   = var.firebase_admin_service_account_id
  display_name = var.firebase_admin_display_name

  depends_on = [google_firebase_project.default, google_project_service.iam]
}

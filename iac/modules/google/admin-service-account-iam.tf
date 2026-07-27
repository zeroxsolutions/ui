# Grant the admin service account the Firebase Admin role.
resource "google_project_iam_member" "firebase_admin_role" {
  provider = google-beta
  project  = var.project_id
  role     = var.firebase_admin_role
  member   = "serviceAccount:${google_service_account.firebase_admin.email}"
}

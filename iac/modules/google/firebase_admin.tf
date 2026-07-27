resource "google_project_service" "iam" {
  provider           = google-beta
  project            = var.project_id
  service            = "iam.googleapis.com"
  disable_on_destroy = false
}

resource "google_service_account" "firebase_admin" {
  provider     = google-beta
  project      = var.project_id
  account_id   = "firebase-admin-sdk"
  display_name = "Firebase Admin SDK"

  depends_on = [google_firebase_project.default, google_project_service.iam]
}

resource "google_project_iam_member" "firebase_admin_role" {
  provider = google-beta
  project  = var.project_id
  role     = "roles/firebase.admin"
  member   = "serviceAccount:${google_service_account.firebase_admin.email}"
}

resource "google_service_account_key" "firebase_admin" {
  provider           = google-beta
  service_account_id = google_service_account.firebase_admin.name
}

locals {
  firebase_admin_key = jsondecode(base64decode(google_service_account_key.firebase_admin.private_key))
}

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

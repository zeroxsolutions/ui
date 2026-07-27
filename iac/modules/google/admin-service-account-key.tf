# JSON key for the admin service account - the Admin SDK credential blob.
resource "google_service_account_key" "firebase_admin" {
  provider           = google-beta
  service_account_id = google_service_account.firebase_admin.name
}

locals {
  firebase_admin_key = jsondecode(base64decode(google_service_account_key.firebase_admin.private_key))
}

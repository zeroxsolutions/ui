# Firebase Auth / Identity Platform - DISABLED by default (both source repos
# chiselhub + mmovn ship this commented pending a GCP billing account; the
# Identity Platform / IAP resources need billing linked).
#
# Re-enable by uncommenting the block below once billing is on. Set
# var.enable_google_signin = true to also turn on the Google Sign-In provider
# (auto-creates the OAuth client via IAP); var.support_email is required then.
# var.oauth_support_email (chiselhub spelling) is kept in variables.tf for the
# UNION but is NOT wired here - prefer var.support_email (mmovn spelling).
#
# MERGED from chiselhub (unconditional structure + outputs) and mmovn
# (count-based toggle on the Google Sign-In subset + enabled=true on the idp
# config). The count toggle is the richer capability, so the merged superset
# is conditional on var.enable_google_signin where mmovn made it conditional.

# resource "google_project_service" "identity_toolkit" {
#   provider           = google-beta
#   project            = var.project_id
#   service            = "identitytoolkit.googleapis.com"
#   disable_on_destroy = false
#
#   depends_on = [google_firebase_project.default]
# }
#
# resource "google_project_service" "iap" {
#   count = var.enable_google_signin ? 1 : 0
#
#   provider           = google-beta
#   project            = var.project_id
#   service            = "iap.googleapis.com"
#   disable_on_destroy = false
#
#   depends_on = [google_firebase_project.default]
# }
#
# resource "google_identity_platform_config" "default" {
#   provider = google-beta
#   project  = var.project_id
#
#   sign_in {
#     allow_duplicate_emails = false
#
#     email {
#       enabled           = true
#       password_required = true
#     }
#   }
#
#   depends_on = [google_project_service.identity_toolkit]
# }
#
# # OAuth consent screen + auto-created OAuth client for Google Sign-In.
# resource "google_iap_brand" "default" {
#   count = var.enable_google_signin ? 1 : 0
#
#   provider          = google-beta
#   project           = var.project_id
#   support_email     = var.support_email
#   application_title = var.app_display_name
#
#   depends_on = [google_project_service.iap]
# }
#
# resource "google_iap_client" "default" {
#   count = var.enable_google_signin ? 1 : 0
#
#   provider     = google-beta
#   brand        = google_iap_brand.default[0].name
#   display_name = "${var.app_display_name} Web Client"
# }
#
# resource "google_identity_platform_default_supported_idp_config" "google" {
#   count = var.enable_google_signin ? 1 : 0
#
#   provider      = google-beta
#   project       = var.project_id
#   idp_id        = "google.com"
#   client_id     = google_iap_client.default[0].client_id
#   client_secret = google_iap_client.default[0].secret
#
#   enabled = true
#
#   depends_on = [google_identity_platform_config.default]
# }
#
# output "google_oauth_client_id" {
#   value = try(google_iap_client.default[0].client_id, null)
# }
#
# output "google_oauth_client_secret" {
#   value     = try(google_iap_client.default[0].secret, null)
#   sensitive = true
# }

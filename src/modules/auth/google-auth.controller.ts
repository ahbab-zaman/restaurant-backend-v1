import { NextFunction, Request, Response } from "express";
import { auth } from "./auth.js";
import { env } from "../../config/env.js";
import ApiError from "../../shared/errors/api-error.js";

export class GoogleAuthController {
  /**
   * GET /api/v1/auth/google/initiate
   *
   * Asks Better Auth to build the Google authorization URL (with PKCE state),
   * then issues a browser-driven redirect to Google's consent screen.
   */
  async googleInitiate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!auth) {
        throw new ApiError(503, "Auth service not ready");
      }

      const postLoginCallbackURL = `${env.betterAuthUrl}/api/v1/auth/google/callback`;

      res.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'unsafe-inline'",
      );

      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Redirecting to Google...</title></head>
        <body>
          <p>Redirecting to Google login...</p>
          <script>
            fetch('/api/auth/sign-in/social', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({
                provider: 'google',
                callbackURL: '${postLoginCallbackURL}'
              })
            }).then(res => res.json()).then(data => {
              if (data.url) {
                window.location.href = data.url;
              } else if (data.redirect) {
                window.location.href = data.redirect;
              } else {
                document.body.innerHTML = '<p>Error: ' + JSON.stringify(data) + '</p>';
              }
            }).catch(err => {
              document.body.innerHTML = '<p>Error: ' + err.message + '</p>';
            });
          </script>
        </body>
        </html>
      `);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/v1/auth/google/callback
   *
   * Receives the authorization code + state from Google.
   */
  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      if (!auth) {
        throw new ApiError(503, "Auth service not ready");
      }

      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session) {
        return res.redirect(302, `${env.appUrl}/login?error=session_failed`);
      }

      const role = String(session.user.role || "STUDENT").toUpperCase();
      const dashboardPath =
        role === "ADMIN"
          ? "/admin"
          : role === "INSTRUCTOR"
            ? "/instructor"
            : "/user";

      return res.redirect(302, `${env.appUrl}${dashboardPath}`);
    } catch (err) {
      console.error("Google OAuth Callback Error:", err);

      const errorCode = req.query.error as string;
      if (errorCode === "unable_to_link_account") {
        return res.redirect(302, `${env.appUrl}/login?error=link_failed`);
      }

      if (err instanceof ApiError && err.statusCode === 403) {
        return res.redirect(302, `${env.appUrl}/login?error=blocked`);
      }

      return next(err);
    }
  }
}

export const googleAuthController = new GoogleAuthController();

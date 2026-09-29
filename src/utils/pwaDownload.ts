/**
 * Utility functions for directly downloading official app launchers and shortcuts
 * for VenkateshBhaiya Assistant.
 */

export function getOfficialAppUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://ais-dev-vgyz3pjrjnpc77ru3rg3gb-29355483832.asia-southeast1.run.app";
}

/**
 * Downloads a standalone HTML App Launcher file.
 * When opened on any phone, tablet, or computer, it immediately launches the official VenkateshBhaiya Assistant website.
 */
export function downloadAppLauncher(filename = "VenkateshBhaiya_Assistant_App.html") {
  const appUrl = getOfficialAppUrl();
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#09090b">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>VenkateshBhaiya Assistant</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #09090b;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
    }
    .card {
      max-width: 420px;
      padding: 32px 24px;
      background: rgba(24, 24, 27, 0.8);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #09090b;
      font-size: 32px;
      font-weight: 900;
    }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 8px; color: #fff; }
    p { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 24px; }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 14px 20px;
      background: #f59e0b;
      color: #09090b;
      font-weight: 700;
      font-size: 15px;
      border-radius: 14px;
      text-decoration: none;
      transition: background 0.2s;
    }
    .badge {
      display: inline-block;
      margin-top: 16px;
      font-size: 11px;
      color: #fbbf24;
      background: rgba(245, 158, 11, 0.1);
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
  </style>
  <script>
    // Automatically redirect to the verified official portal
    window.onload = function() {
      setTimeout(function() {
        window.location.replace("${appUrl}");
      }, 500);
    };
  </script>
</head>
<body>
  <div class="card">
    <div class="icon">VB</div>
    <h1>VenkateshBhaiya Assistant</h1>
    <p>Opening official secure portal...</p>
    <a href="${appUrl}" class="btn">Launch Assistant Now</a>
    <div class="badge">Official Verified Portal</div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Downloads a desktop .url shortcut file for Windows or Mac.
 */
export function downloadInternetShortcut(filename = "VenkateshBhaiya_Assistant.url") {
  const appUrl = getOfficialAppUrl();
  const fileContent = `[InternetShortcut]\nURL=${appUrl}\nIconIndex=0\n`;
  const blob = new Blob([fileContent], { type: "application/internet-shortcut" });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}

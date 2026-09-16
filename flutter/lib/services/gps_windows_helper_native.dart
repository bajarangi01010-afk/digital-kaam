// Native implementation — uses dart:io Process to query Windows GeoCoordinateWatcher.
import 'dart:io';

Future<Map<String, double>?> getWindowsGpsCoordinates() async {
  const psCommand = "Add-Type -AssemblyName System.Device; "
      "\$w = New-Object System.Device.Location.GeoCoordinateWatcher(1); "
      "\$w.TryStart(\$false, [TimeSpan]::FromSeconds(2)); "
      "Start-Sleep -Milliseconds 1200; "
      "\$p = \$w.Position.Location; "
      "if (-not \$p.IsUnknown) { Write-Output ('' + \$p.Latitude + ',' + \$p.Longitude) }";

  try {
    final result = await Process.run(
      'powershell',
      ['-NoProfile', '-Command', psCommand],
    );

    if (result.exitCode == 0 && result.stdout != null) {
      final out = result.stdout.toString().trim();
      final lines = out.split(RegExp(r'[\r\n]+'));
      for (final line in lines) {
        if (line.contains(',')) {
          final parts = line.trim().split(',');
          if (parts.length >= 2) {
            final pLat = double.tryParse(parts[0].trim());
            final pLng = double.tryParse(parts[1].trim());
            if (pLat != null && pLng != null && (pLat != 0 || pLng != 0)) {
              return {'lat': pLat, 'lng': pLng};
            }
          }
        }
      }
    }
  } catch (_) {}
  return null;
}

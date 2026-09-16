import 'package:s2geometry/s2geometry.dart';

/// Native (Android, iOS, Desktop) implementation using Google S2 Geometry
String calculateS2CellToken(double lat, double lng, {int level = 14}) {
  try {
    final latLng = S2LatLng.fromDegrees(lat, lng);
    final cellId = S2CellId.fromLatLng(latLng).parentAtLevel(level);
    return cellId.toToken();
  } catch (_) {
    return "s2_${lat.toStringAsFixed(3)}_${lng.toStringAsFixed(3)}";
  }
}

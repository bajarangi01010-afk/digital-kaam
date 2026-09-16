/// Web-safe stub for S2 geometry token calculation
String calculateS2CellToken(double lat, double lng, {int level = 14}) {
  return "s2_${lat.toStringAsFixed(3)}_${lng.toStringAsFixed(3)}";
}

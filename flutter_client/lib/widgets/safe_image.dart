import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class SafeImage extends StatelessWidget {
  final File? file;
  final double? width;
  final double? height;
  final BoxFit fit;

  const SafeImage({
    super.key,
    this.file,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
  });

  @override
  Widget build(BuildContext context) {
    if (file == null) {
      return Container(
        width: width,
        height: height,
        color: const Color(0xFF1E293B),
        child: const Icon(Icons.image, color: Color(0xFF64748B)),
      );
    }

    if (kIsWeb) {
      return Image.network(
        file!.path,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (ctx, err, stack) => Container(
          width: width,
          height: height,
          color: const Color(0xFF1E293B),
          child: const Icon(Icons.image, color: Color(0xFF64748B)),
        ),
      );
    }

    return Image.file(
      file!,
      width: width,
      height: height,
      fit: fit,
      errorBuilder: (ctx, err, stack) => Container(
        width: width,
        height: height,
        color: const Color(0xFF1E293B),
        child: const Icon(Icons.image, color: Color(0xFF64748B)),
      ),
    );
  }
}

ImageProvider getSafeFileImageProvider(File file) {
  if (kIsWeb) {
    return NetworkImage(file.path);
  }
  return FileImage(file);
}

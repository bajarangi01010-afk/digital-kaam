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

    // Compute memory-optimized downsample constraints to prevent Out-Of-Memory
    final int targetCacheWidth = width != null ? (width! * 2).round().clamp(100, 800) : 600;
    final int targetCacheHeight = height != null ? (height! * 2).round().clamp(100, 800) : 600;

    Widget buildPlaceholder() => Container(
      width: width,
      height: height,
      color: const Color(0xFF1E293B),
      child: const Center(
        child: SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF64748B)),
        ),
      ),
    );

    Widget buildErrorContainer() => Container(
      width: width,
      height: height,
      color: const Color(0xFF1E293B),
      child: const Icon(Icons.image_not_supported, color: Color(0xFF64748B)),
    );

    if (kIsWeb) {
      return Image.network(
        file!.path,
        width: width,
        height: height,
        fit: fit,
        cacheWidth: targetCacheWidth,
        cacheHeight: targetCacheHeight,
        frameBuilder: (ctx, child, frame, wasSynchronouslyLoaded) {
          if (wasSynchronouslyLoaded || frame != null) {
            return child;
          }
          return buildPlaceholder();
        },
        errorBuilder: (ctx, err, stack) => buildErrorContainer(),
      );
    }

    return Image.file(
      file!,
      width: width,
      height: height,
      fit: fit,
      cacheWidth: targetCacheWidth,
      cacheHeight: targetCacheHeight,
      frameBuilder: (ctx, child, frame, wasSynchronouslyLoaded) {
        if (wasSynchronouslyLoaded || frame != null) {
          return child;
        }
        return buildPlaceholder();
      },
      errorBuilder: (ctx, err, stack) => buildErrorContainer(),
    );
  }
}

ImageProvider getSafeFileImageProvider(File file) {
  if (kIsWeb) {
    return NetworkImage(file.path);
  }
  return FileImage(file);
}

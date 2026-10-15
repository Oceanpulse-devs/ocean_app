# 🚀 Media Optimization & Frontend Integration Guide
**Applies to:** Cloudflare R2 Media Delivery, Stories, Feed Videos, Profiles, Covers, and Realtime Chat

---

## Part 1: Backend Optimizations Applied

All uploads hitting **Cloudflare R2** are now automatically pre-processed on the backend before storage:

| Media Type | Processing Applied | Output Format | Avg File Size |
| :--- | :--- | :--- | :--- |
| **Story Images** | Auto-scaled to 1080×1920 inside, EXIF stripped, Sharp WebP compression | `image/webp` | **~150 KB** (down from 6MB) |
| **Profile Photos** | Auto-centered & cropped to 300×300, Sharp WebP | `image/webp` | **~18 KB** (down from 2MB) |
| **Cover Photos** | Auto-scaled to 1200×500 inside, Sharp WebP | `image/webp` | **~80 KB** (down from 4MB) |
| **Chat Images** | Downscaled to max 1440px WebP + 250px preview thumbnail (`thumbnailUrl`) | `image/webp` | **~140 KB** |
| **Videos (Stories & Feed)** | H.264 MP4 with `+faststart` (stream on frame 1) + WebP poster frame (`thumbnailUrl`) | `video/mp4` | Compressed & faststart |

All R2 files are served with:
```http
Cache-Control: public, max-age=31536000, immutable
```
Cloudflare CDN edges and the user's mobile device cache them permanently.

---

## Part 2: Frontend (Flutter) Handover Instructions

Share this section with the frontend mobile developer:

### 1. Fix Story Timer Starting Before Image Loads (CRITICAL)

**The Bug:** The story timer countdown runs while the image is still buffering, causing 25–50% of the story time to expire before the user even sees the picture.

**The Fix:**
- Set your story `AnimationController` to **pause** initially.
- Only start (`forward()`) the animation once the image has finished loading into memory.

```dart
// Example using CachedNetworkImage:
CachedNetworkImage(
  imageUrl: currentStory.mediaUrl,
  fit: BoxFit.cover,
  imageBuilder: (context, imageProvider) {
    // Media has rendered on screen -> start the timer now!
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!storyController.isAnimating) {
        storyController.forward();
      }
    });
    return Image(image: imageProvider, fit: BoxFit.cover);
  },
  placeholder: (context, url) {
    // While loading, ensure the story timer is paused!
    if (storyController.isAnimating) {
      storyController.stop();
    }
    return Center(
      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
    );
  },
  errorWidget: (context, url, error) => Icon(Icons.error, color: Colors.white),
)
```

---

### 2. Pre-cache Upcoming Stories (The Instagram Trick)

**The Goal:** When the user taps to go to the next story, it must render with **0ms delay**.

**The Fix:**
While the user is watching story index `i`, pre-cache story `i + 1` and `i + 2` in the background:

```dart
void precacheUpcomingStories(List<Story> stories, int currentIndex, BuildContext context) {
  for (int j = 1; j <= 2; j++) {
    int nextIndex = currentIndex + j;
    if (nextIndex < stories.length) {
      final nextStory = stories[nextIndex];
      if (nextStory.mediaType == 'image' && nextStory.mediaUrl != null) {
        precacheImage(CachedNetworkImageProvider(nextStory.mediaUrl!), context);
      }
    }
  }
}
```

Call this whenever a story becomes active!

---

### 3. Instant Chat Image Sending (Optimistic UI)

**The Bug:** Sending an image takes 3–5 seconds because the app waits for the network upload before showing the chat bubble.

**The Fix:**
1. When user taps "Send", immediately insert a local message bubble using the local `File(imagePath)`:
   ```dart
   final optimisticMessage = Message(
     id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
     localFilePath: pickedFile.path,
     isUploading: true,
     createdAt: DateTime.now(),
   );
   // Add to chat list immediately:
   messagesList.insert(0, optimisticMessage);
   ```
2. Display the image bubble instantly from the local file with a subtle loading spinner overlay.
3. In the background, upload to `/api/messages/upload` and send the message via socket `send_message`.
4. When socket responds with the real message, replace the temp item.
5. To the user, **sending feels instantaneous (0ms)**.

---

### 4. Chat Image Thumbnail Progressive Loading (Receiver Side)

When receiving a message with media:
- The backend `/api/messages/upload` now returns:
  - `mediaUrl`: Full-resolution optimized WebP image.
  - `thumbnailUrl`: Ultra-lightweight 250px thumbnail.
- Use `CachedNetworkImage`'s `placeholder` to display `thumbnailUrl` instantly:
  ```dart
  CachedNetworkImage(
    imageUrl: message.mediaUrl,
    placeholder: (context, url) => message.thumbnailUrl != null
        ? Image.network(message.thumbnailUrl!, fit: BoxFit.cover)
        : Center(child: CircularProgressIndicator(strokeWidth: 2)),
    fit: BoxFit.cover,
  )
  ```

---

### 5. Memory-Safe Profile Pictures in Lists

In chat lists or feed lists, **never** decode full-size images into memory:
```dart
CachedNetworkImage(
  imageUrl: user.profilePicture,
  memCacheWidth: 150,  // Prevents high memory consumption on Android/iOS
  memCacheHeight: 150,
  fit: BoxFit.cover,
)
```

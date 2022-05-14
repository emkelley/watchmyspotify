<script setup lang="ts"></script>
<template>
  <details>
    <summary
      class="text-emerald-400 mb-2 uppercase font-medium cursor-pointer select-none"
    >
      Bugs & Troubleshooting:
    </summary>

    <details class="pl-4">
      <summary class="text-emerald-200 mb-2 text-sm cursor-pointer select-none">
        YouTube Embed - "This video is unavailable."
      </summary>
      <p class="text-emerald-50 py-1 pl-4 mb-2">
        If you see errors when the embed opens, try opening the playlist with
        the button below the embed.
      </p>
    </details>

    <details class="pl-4">
      <summary class="text-emerald-200 mb-2 text-sm cursor-pointer select-none">
        Songs failed to scrape or timed out
      </summary>
      <p class="text-emerald-50 py-1 pl-4 mb-2">
        If songs get stuck and time out when scraping, run the conversion again
        on the playlist to pick up those failed songs.
      </p>
    </details>

    <details class="pl-4">
      <summary class="text-emerald-200 mb-2 text-sm cursor-pointer select-none">
        The conversion is taking forever to complete
      </summary>
      <p class="text-emerald-50 py-1 pl-4 mb-2">
        Have some patience; For each song, the backend is opening a chrome
        instance, searching YouTube, and then extracting video IDs. This can
        take a while - up to 10 seconds per song before timing out.
      </p>
    </details>

    <details class="pl-4">
      <summary class="text-emerald-200 mb-2 text-sm cursor-pointer select-none">
        How was this tool built?
      </summary>
      <p class="text-emerald-50 py-1 pl-4 mb-2">
        Watch My Spotify was built with Vue 3 and Tailwind CSS. It uses the
        Spotify API to scrape the playlist and Puppeteer running in a Netlify
        Function to scrape video ID's from YouTube. Finally it uses an
        undocumented endpoint to create a playlist on YouTube without needing to
        be logged in.
      </p>
    </details>
  </details>
</template>

<style scoped></style>

import { describe, expect, it } from "vitest";
import {
  ACCEPTED_EXTENSIONS,
  SUPPORTED_AUDIO_EXTENSIONS,
  SUPPORTED_VIDEO_EXTENSIONS,
  acceptFor,
  buildOutputPath,
  extensionsFor,
  extname,
  humanBytes,
  humanClock,
  humanDuration,
  isSupportedFile,
  kindFromExtension,
  kindFromPath,
  savedPercent,
  splitPath,
  stem,
} from "@/lib/files";

describe("splitPath", () => {
  it("splits windows paths into directory and file name", () => {
    expect(splitPath("C:\\Users\\ana\\clips\\video1.mp4")).toEqual({
      directory: "C:/Users/ana/clips",
      fileName: "video1.mp4",
    });
  });

  it("normalizes forward slashes", () => {
    expect(splitPath("/home/ana/audio.mp3")).toEqual({
      directory: "/home/ana",
      fileName: "audio.mp3",
    });
  });

  it("handles a bare file name", () => {
    expect(splitPath("audio1.mp3")).toEqual({
      directory: "",
      fileName: "audio1.mp3",
    });
  });
});

describe("extname / stem", () => {
  it("returns the lower-case extension without dot", () => {
    expect(extname("C:/tmp/CLIP.MKV")).toBe("mkv");
    expect(extname("C:/tmp/archive.tar.gz")).toBe("gz");
  });

  it("returns an empty string when there is no extension", () => {
    expect(extname("C:/tmp/README")).toBe("");
  });

  it("ignores a leading dot (dotfiles)", () => {
    expect(extname(".gitignore")).toBe("");
  });

  it("removes only the last extension", () => {
    expect(stem("C:/tmp/archive.tar.gz")).toBe("archive.tar");
    expect(stem("C:/tmp/video1.mp4")).toBe("video1");
  });
});

describe("kind detection", () => {
  it("detects video and audio extensions", () => {
    expect(kindFromExtension("mkv")).toBe("video");
    expect(kindFromExtension(".MP4")).toBe("video");
    expect(kindFromExtension("flac")).toBe("audio");
    expect(kindFromExtension("m4a")).toBe("audio");
  });

  it("returns null for unsupported extensions", () => {
    expect(kindFromExtension("txt")).toBeNull();
    expect(kindFromExtension("")).toBeNull();
  });

  it("detects from a full path", () => {
    expect(kindFromPath("C:/a/b.mov")).toBe("video");
    expect(kindFromPath("C:/a/b.opus")).toBe("audio");
  });

  it("accepts every file in files-mock", () => {
    expect(isSupportedFile("files-mock/audio1.mp3")).toBe(true);
    expect(isSupportedFile("files-mock/audio2.m4a")).toBe(true);
    expect(isSupportedFile("files-mock/video1.mp4")).toBe(true);
  });
});

describe("intake filters", () => {
  it("only lists video extensions for a video intake", () => {
    const extensions = extensionsFor("video");
    expect(extensions).toEqual(SUPPORTED_VIDEO_EXTENSIONS);
    expect(extensions).toContain("mkv");
    expect(extensions).not.toContain("mp3");
  });

  it("only lists audio extensions for an audio intake", () => {
    const extensions = extensionsFor("audio");
    expect(extensions).toEqual(SUPPORTED_AUDIO_EXTENSIONS);
    expect(extensions).toContain("flac");
    expect(extensions).not.toContain("mp4");
  });

  it("accepts everything when the intake is open", () => {
    expect(extensionsFor(null)).toEqual(ACCEPTED_EXTENSIONS);
    expect(extensionsFor()).toEqual(ACCEPTED_EXTENSIONS);
  });

  it("builds the accept attribute for the intake", () => {
    expect(acceptFor("audio")).toBe(
      SUPPORTED_AUDIO_EXTENSIONS.map((ext) => `.${ext}`).join(","),
    );
  });

  it("rejects files outside the intake", () => {
    expect(isSupportedFile("files-mock/video1.mp4", "video")).toBe(true);
    expect(isSupportedFile("files-mock/audio1.mp3", "video")).toBe(false);
    expect(isSupportedFile("files-mock/audio1.mp3", "audio")).toBe(true);
    expect(isSupportedFile("files-mock/video1.mp4", "audio")).toBe(false);
    expect(isSupportedFile("files-mock/notes.txt", "video")).toBe(false);
  });
});

describe("buildOutputPath", () => {
  it("keeps the source directory by default", () => {
    expect(buildOutputPath("C:/media/clip.mkv", "mp4")).toBe(
      "C:/media/clip.mp4",
    );
  });

  it("uses the output directory when provided", () => {
    expect(buildOutputPath("C:/media/clip.mkv", "mp3", "D:/out")).toBe(
      "D:/out/clip.mp3",
    );
  });

  it("avoids overwriting the input when the extension matches", () => {
    expect(buildOutputPath("C:/media/clip.mp4", "mp4")).toBe(
      "C:/media/clip-convertido.mp4",
    );
  });

  it("keeps the original extension in the stem", () => {
    expect(buildOutputPath("C:/media/clip.final.mkv", "mp4")).toBe(
      "C:/media/clip.final.mp4",
    );
  });
});

describe("humanBytes", () => {
  it("formats bytes without decimals", () => {
    expect(humanBytes(512)).toBe("512 B");
  });

  it("formats megabytes with one decimal", () => {
    expect(humanBytes(7122240)).toBe("6.8 MB");
  });

  it("drops trailing .0", () => {
    expect(humanBytes(1024 * 1024)).toBe("1 MB");
  });

  it("handles zero and invalid input", () => {
    expect(humanBytes(0)).toBe("0 B");
    expect(humanBytes(Number.NaN)).toBe("0 B");
  });
});

describe("humanDuration / humanClock", () => {
  it("formats under a minute", () => {
    expect(humanDuration(7)).toBe("7s");
  });

  it("formats minutes with padded seconds", () => {
    expect(humanDuration(192)).toBe("3m 12s");
  });

  it("formats hours", () => {
    expect(humanDuration(4321)).toBe("1h 12m");
  });

  it("returns an em dash for unknown values", () => {
    expect(humanDuration(null)).toBe("—");
    expect(humanDuration(undefined)).toBe("—");
    expect(humanDuration(Number.POSITIVE_INFINITY)).toBe("—");
  });

  it("formats clock values for playback and ETA", () => {
    expect(humanClock(72)).toBe("01:12");
    expect(humanClock(3725)).toBe("1:02:05");
    expect(humanClock(null)).toBe("--:--");
  });
});

describe("savedPercent", () => {
  it("computes the size reduction", () => {
    expect(savedPercent(1000, 250)).toBe(75);
  });

  it("returns a negative value when the output grows", () => {
    expect(savedPercent(1000, 1250)).toBe(-25);
  });

  it("guards against a zero input size", () => {
    expect(savedPercent(0, 100)).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import {
  CONVERSION_PRESETS,
  FORMATS,
  availableTargets,
  canTarget,
  defaultTargetFor,
  formatLabel,
  isTargetFormat,
  qualityLabel,
  targetsFor,
  type TargetFormat,
} from "@/lib/formats";

describe("format catalog", () => {
  it("exposes unique extensions", () => {
    const extensions = Object.values(FORMATS).map((spec) => spec.extension);
    expect(new Set(extensions).size).toBe(extensions.length);
  });

  it("keeps ids and extension in sync", () => {
    for (const spec of Object.values(FORMATS)) {
      expect(spec.id).toBe(spec.extension);
      expect(spec.label.toUpperCase()).toBe(spec.extension.toUpperCase());
    }
  });

  it("only gives video specs a video codec", () => {
    for (const spec of Object.values(FORMATS)) {
      if (spec.kind === "video") expect(spec.vcodec).toBeTruthy();
      else expect(spec.vcodec).toBeUndefined();
    }
  });
});

describe("isTargetFormat", () => {
  it("accepts known formats", () => {
    expect(isTargetFormat("mp4")).toBe(true);
    expect(isTargetFormat("flac")).toBe(true);
  });

  it("rejects unknown or unsafe values", () => {
    expect(isTargetFormat("exe")).toBe(false);
    expect(isTargetFormat("")).toBe(false);
  });
});

describe("targetsFor", () => {
  it("lists video outputs for video sources", () => {
    expect(targetsFor("video")).toEqual(["mp4", "mkv", "webm", "mov"]);
  });

  it("lists audio outputs for audio sources", () => {
    expect(targetsFor("audio")).toEqual(["mp3", "aac", "m4a", "wav", "flac"]);
  });

  it("does not leak the shared array", () => {
    const list = targetsFor("audio");
    list.pop();
    expect(targetsFor("audio")).toHaveLength(5);
  });
});

describe("canTarget", () => {
  it("allows video sources to reach audio targets", () => {
    expect(canTarget("video", "mp3")).toBe(true);
    expect(canTarget("video", "mp4")).toBe(true);
  });

  it("blocks audio sources from video targets", () => {
    expect(canTarget("audio", "mp4")).toBe(false);
    expect(canTarget("audio", "mp3")).toBe(true);
  });

  it("is consistent with availableTargets", () => {
    for (const target of availableTargets("audio")) {
      expect(canTarget("audio", target)).toBe(true);
    }
  });
});

describe("preset output lock", () => {
  it("narrows a video intake to audio containers", () => {
    expect(availableTargets("video", "audio")).toEqual([
      "mp3",
      "aac",
      "m4a",
      "wav",
      "flac",
    ]);
  });

  it("keeps both families when there is no lock", () => {
    expect(availableTargets("video", null)).toHaveLength(9);
  });

  it("blocks the other family even for a video source", () => {
    expect(canTarget("video", "mp4", "audio")).toBe(false);
    expect(canTarget("video", "mp3", "audio")).toBe(true);
  });

  it("never locks a preset out of its own target", () => {
    for (const preset of CONVERSION_PRESETS) {
      const outputKind = FORMATS[preset.target].kind;
      const allowed = availableTargets(preset.source, outputKind);

      expect(allowed).toContain(preset.target);
      for (const target of allowed) {
        expect(canTarget(preset.source, target, outputKind)).toBe(true);
      }
    }
  });
});

describe("defaults", () => {
  it("defaults video to mp4 and audio to mp3", () => {
    expect(defaultTargetFor("video")).toBe("mp4");
    expect(defaultTargetFor("audio")).toBe("mp3");
  });

  it("marks video-first targets as recommended", () => {
    expect(FORMATS.mp4.recommended).toBe(true);
    expect(FORMATS.mp3.recommended).toBe(true);
    expect(FORMATS.webm.recommended).toBeUndefined();
  });

  it("labels quality presets", () => {
    expect(qualityLabel("compact")).toBe("Compacta");
    expect(formatLabel("flac")).toBe("FLAC");
  });

  it("only references valid targets from presets", () => {
    for (const preset of CONVERSION_PRESETS) {
      expect(isTargetFormat(preset.target)).toBe(true);
      expect(canTarget(preset.source, preset.target as TargetFormat)).toBe(true);
    }
  });
});

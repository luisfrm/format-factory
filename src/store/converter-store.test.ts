import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProbeResult } from "@/lib/backend";
import { useConverterStore } from "@/store/converter-store";

vi.mock("@/lib/backend", () => ({
  isTauri: false,
  backend: {
    engines: vi.fn(async () => []),
    pickMediaFiles: vi.fn(async () => []),
    pickDirectory: vi.fn(async () => null),
    probe: vi.fn(async () => []),
    startJob: vi.fn(async () => {}),
    cancelJob: vi.fn(async () => {}),
    revealInFolder: vi.fn(async () => {}),
    openFile: vi.fn(async () => {}),
    onJobUpdate: vi.fn(() => () => {}),
  },
}));

import { backend } from "@/lib/backend";

const VIDEO = "C:/media/clip.mp4";
const AUDIO = "C:/media/song.mp3";

function probeResult(path: string): ProbeResult {
  const extension = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  const name = path.slice(path.lastIndexOf("/") + 1);

  return {
    path,
    name,
    extension,
    kind: extension === "mp3" ? "audio" : "video",
    bytes: 1024,
  };
}

describe("converter store intake", () => {
  beforeEach(() => {
    useConverterStore.setState({
      files: [],
      quality: "balanced",
      outputDirectory: null,
      pendingTarget: null,
      pendingSource: null,
    });

    vi.mocked(backend.probe).mockImplementation(async (paths) =>
      paths.map(probeResult),
    );
    vi.mocked(backend.pickMediaFiles).mockResolvedValue([]);
  });

  it("stages only video files for a video-to-audio preset", async () => {
    await useConverterStore.getState().addPaths([VIDEO, AUDIO], {
      source: "video",
      target: "mp3",
    });

    const { files } = useConverterStore.getState();
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({
      path: VIDEO,
      kind: "video",
      target: "mp3",
      outputKind: "audio",
    });
  });

  it("locks the staged file to audio outputs", async () => {
    await useConverterStore.getState().addPaths([VIDEO], {
      source: "video",
      target: "mp3",
    });

    const [file] = useConverterStore.getState().files;
    useConverterStore.getState().setTarget(file.id, "mp4");
    useConverterStore.getState().applyTargetToAll("webm");

    expect(useConverterStore.getState().files[0].target).toBe("mp3");
  });

  it("keeps both families available for a plain intake", async () => {
    await useConverterStore.getState().addPaths([VIDEO]);

    const [file] = useConverterStore.getState().files;
    expect(file.outputKind).toBeNull();
    expect(file.target).toBe("mp4");

    useConverterStore.getState().setTarget(file.id, "mp3");
    expect(useConverterStore.getState().files[0].target).toBe("mp3");
  });

  it("only applies a video target to files that can reach it", async () => {
    await useConverterStore.getState().addPaths([VIDEO, AUDIO]);
    useConverterStore.getState().applyTargetToAll("webm");

    const targets = useConverterStore.getState().files.map((file) => file.target);
    expect(targets).toEqual(["webm", "mp3"]);
  });

  it("asks the dialog for the preset's source family", async () => {
    await useConverterStore.getState().pickFilesWithTarget("mp3", "video");

    expect(backend.pickMediaFiles).toHaveBeenCalledWith("video");
  });

  it("does not leak a preset intake into the next pick", async () => {
    useConverterStore.setState({ pendingTarget: "mp3", pendingSource: "video" });

    await useConverterStore.getState().pickFiles();

    const state = useConverterStore.getState();
    expect(state.pendingTarget).toBeNull();
    expect(state.pendingSource).toBeNull();
    expect(backend.pickMediaFiles).toHaveBeenCalledWith("video");
  });
});

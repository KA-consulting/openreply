import { describe, it, expect, vi, afterEach } from "vitest";
import {
  sendDirectMessageWithLinkButton,
  sendPrivateReplyWithButton,
} from "../lib/meta/client";

function stubFetch() {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ recipient_id: "u", message_id: "m" }),
    text: async () => "{}",
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentButtons(fetchMock: ReturnType<typeof stubFetch>) {
  const init = fetchMock.mock.calls[0] as unknown as [string, { body: string }];
  return JSON.parse(init[1].body).message.attachment.payload.buttons;
}

afterEach(() => vi.unstubAllGlobals());

describe("button templates", () => {
  it("mixes a link and a postback button in a DM", async () => {
    const fetchMock = stubFetch();
    await sendDirectMessageWithLinkButton("tok", "ig", "user", "texte", [
      { title: "Voir la vidéo", url: "https://youtu.be/x" },
      { title: "Travailler avec moi avec un titre trop long", payload: "reveal:abc" },
    ]);

    expect(sentButtons(fetchMock)).toEqual([
      { type: "web_url", url: "https://youtu.be/x", title: "Voir la vidéo" },
      { type: "postback", payload: "reveal:abc", title: "Travailler avec moi " },
    ]);
  });

  it("keeps the opening button first and adds the extra one after it", async () => {
    const fetchMock = stubFetch();
    await sendPrivateReplyWithButton("tok", "ig", "comment", "texte", "Oui", "reveal:1", [
      { title: "Travailler avec moi", payload: "reveal:2" },
    ]);

    expect(sentButtons(fetchMock)).toEqual([
      { type: "postback", title: "Oui", payload: "reveal:1" },
      { type: "postback", title: "Travailler avec moi", payload: "reveal:2" },
    ]);
  });
});

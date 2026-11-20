import { describe, expect, test } from "vitest";
import { createFollowsStore } from "./followsStore";
import { memoryStorage } from "./memoryStorage";

describe("remembering who a person follows", () => {
  test('follows and "me" are there again on the next visit', async () => {
    const storage = memoryStorage();
    const store = createFollowsStore(storage);
    await store.followSwimmer("license:300");
    await store.followClub("SV Bayer Wuppertal");
    await store.setMe("license:100");

    expect(await createFollowsStore(storage).load()).toEqual({
      me: "license:100",
      swimmers: ["license:300"],
      clubs: ["SV Bayer Wuppertal"],
    });
  });

  test("a first visit follows nobody", async () => {
    expect(await createFollowsStore(memoryStorage()).load()).toEqual({ me: null, swimmers: [], clubs: [] });
  });

  test('unfollowing and undoing "me" are remembered too', async () => {
    const storage = memoryStorage();
    const store = createFollowsStore(storage);
    await store.followSwimmer("license:300");
    await store.followSwimmer("license:400");
    await store.followClub("SG Essen");
    await store.setMe("license:100");

    await store.unfollowSwimmer("license:300");
    await store.unfollowClub("SG Essen");
    await store.setMe(null);

    expect(await createFollowsStore(storage).load()).toEqual({ me: null, swimmers: ["license:400"], clubs: [] });
  });

  test("following someone twice keeps them once", async () => {
    const store = createFollowsStore(memoryStorage());
    await store.followSwimmer("license:300");

    expect((await store.followSwimmer("license:300")).swimmers).toEqual(["license:300"]);
  });

  test("stored follows that can't be read start from nobody instead of failing", async () => {
    const storage = memoryStorage();
    await storage.set("follows", { swimmers: "not a list" });

    expect(await createFollowsStore(storage).load()).toEqual({ me: null, swimmers: [], clubs: [] });
  });
});

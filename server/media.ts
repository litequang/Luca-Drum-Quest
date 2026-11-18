import type { FastifyInstance } from "fastify";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { pool, transaction, audit, decode } from "./db.js";
import { config } from "./config.js";
import { parent, fail, secret } from "./auth.js";
import { canViewRecord } from "./permissions.js";
export async function mediaRoutes(app: FastifyInstance) {
  for (const [resource, kind] of [
    ["journal", "journal"],
    ["practices", "practices"],
  ]) {
    app.get(`/api/v1/${resource}/:id/media`, async (req) => {
      const id = z.uuid().parse((req.params as any).id);
      const row = (
        await pool.query("SELECT * FROM records WHERE id=? AND kind=?", [
          id,
          kind,
        ])
      )[0];
      if (!row || !(await canViewRecord(req.user, row)))
        fail(404, "Record not found");
      return pool.query("SELECT id,mime,size FROM media WHERE record_id=?", [
        id,
      ]);
    });
    app.post(
      `/api/v1/admin/${resource}/:id/media`,
      {
        preHandler: parent,
        config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
      },
      async (req) => {
        const recordId = z.uuid().parse((req.params as any).id);
        const file = await req.file();
        if (!file) fail(400, "One image required");
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
          fail(
            415,
            "Local pilot accepts JPEG, PNG and WebP images only; use a YouTube link for video",
          );
        const buffer = await file.toBuffer();
        let output: Buffer;
        try {
          const input = sharp(buffer, {
              limitInputPixels: 20_000_000,
              animated: false,
            }),
            metadata = await input.metadata();
          if (!["jpeg", "png", "webp"].includes(metadata.format ?? ""))
            fail(415, "Unsupported image");
          output = await input
            .rotate()
            .resize({
              width: 2400,
              height: 2400,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp()
            .toBuffer();
        } catch {
          fail(415, "Invalid image");
        }
        const id = randomUUID(),
          key = secret().slice(0, 40);
        await mkdir(config.mediaDir, { recursive: true, mode: 0o700 });
        try {
          await transaction(async (c) => {
            await c.query("SELECT id FROM project WHERE id=1 FOR UPDATE");
            if (
              !(
                await c.query("SELECT id FROM records WHERE id=? AND kind=?", [
                  recordId,
                  kind,
                ])
              ).length
            )
              fail(404, "Record not found");
            const quota = (
              await c.query(
                "SELECT COALESCE(SUM(size),0) total,COUNT(*) count FROM media",
              )
            )[0];
            const count = (
              await c.query("SELECT COUNT(*) n FROM media WHERE record_id=?", [
                recordId,
              ])
            )[0].n;
            if (
              Number(quota.total) + output.length > 200 * 1024 * 1024 ||
              quota.count >= 200 ||
              count >= 10
            )
              fail(413, "Local storage quota reached");
            await writeFile(resolve(config.mediaDir, key), output, {
              flag: "wx",
              mode: 0o600,
            });
            await c.query(
              "INSERT INTO media (id,record_id,storage_key,mime,size) VALUES (?,?,?,?,?)",
              [id, recordId, key, "image/webp", output.length],
            );
            await audit(c, req.user!.id, "media.upload", id, null, {
              recordId,
              kind,
              size: output.length,
            });
          });
        } catch (e) {
          await unlink(resolve(config.mediaDir, key)).catch(() => {});
          throw e;
        }
        return { id };
      },
    );
    app.delete(
      `/api/v1/admin/${resource}/:id`,
      {
        preHandler: parent,
        config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
      },
      async (req) => {
        const id = z.uuid().parse((req.params as any).id);
        let files: any[] = [];
        await transaction(async (c) => {
          await c.query("SELECT id FROM project WHERE id=1 FOR UPDATE");
          const row = (
            await c.query(
              "SELECT * FROM records WHERE id=? AND kind=? FOR UPDATE",
              [id, kind],
            )
          )[0];
          if (!row) fail(404, "Record not found");
          files = await c.query(
            "SELECT storage_key FROM media WHERE record_id=?",
            [id],
          );
          await c.query("DELETE FROM records WHERE id=?", [id]);
          await audit(c, req.user!.id, kind + ".delete", id, decode(row), null);
        });
        for (const f of files)
          await unlink(resolve(config.mediaDir, f.storage_key)).catch(() => {});
        return { ok: true };
      },
    );
  }
  app.get("/api/v1/media/:id", async (req, reply) => {
    const id = z.uuid().parse((req.params as any).id);
    const row = (
      await pool.query(
        "SELECT m.*,r.kind,r.data FROM media m JOIN records r ON r.id=m.record_id WHERE m.id=?",
        [id],
      )
    )[0];
    if (
      !row ||
      !(await canViewRecord(req.user, {
        id: row.record_id,
        kind: row.kind,
        data: row.data,
      }))
    )
      fail(404, "Media not found");
    reply
      .header("Cache-Control", "no-store")
      .header("Content-Disposition", "inline")
      .type(row.mime);
    return reply.send(
      await readFile(resolve(config.mediaDir, row.storage_key)),
    );
  });
  app.delete(
    "/api/v1/admin/media/:id",
    {
      preHandler: parent,
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    },
    async (req) => {
      const id = z.uuid().parse((req.params as any).id);
      let key = "";
      await transaction(async (c) => {
        await c.query("SELECT id FROM project WHERE id=1 FOR UPDATE");
        const row = (await c.query("SELECT * FROM media WHERE id=?", [id]))[0];
        if (!row) fail(404, "Media not found");
        key = row.storage_key;
        await c.query("DELETE FROM media WHERE id=?", [id]);
        await audit(
          c,
          req.user!.id,
          "media.delete",
          id,
          { recordId: row.record_id },
          null,
        );
      });
      await unlink(resolve(config.mediaDir, key)).catch(() => {});
      return { ok: true };
    },
  );
}

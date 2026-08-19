import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedRedirectUrl, sanitizeRedirectUrl } from "../src/redirect-policy";

test("allows app-owned origins only", () => {
  assert.ok(isAllowedRedirectUrl("https://faithandfireministries.co.za"));
  assert.ok(isAllowedRedirectUrl("https://faithandfireministries.co.za/give?status=SUCCESS"));
  assert.ok(isAllowedRedirectUrl("http://localhost:3000/give"));
  assert.ok(isAllowedRedirectUrl("http://localhost:4173"));
});

test("rejects foreign origins and schemes", () => {
  assert.ok(!isAllowedRedirectUrl("https://evil.example.com"));
  assert.ok(!isAllowedRedirectUrl("https://faithandfireministries.co.za.evil.com"));
  assert.ok(!isAllowedRedirectUrl("javascript:alert(1)"));
  assert.ok(!isAllowedRedirectUrl("data:text/html,<script>alert(1)</script>"));
  assert.ok(!isAllowedRedirectUrl("file:///etc/passwd"));
  assert.ok(!isAllowedRedirectUrl("//evil.example.com"));
  assert.ok(!isAllowedRedirectUrl("evil.example.com"));
  assert.ok(!isAllowedRedirectUrl(""));
  assert.ok(!isAllowedRedirectUrl(null));
  assert.ok(!isAllowedRedirectUrl(undefined));
  assert.ok(!isAllowedRedirectUrl("https://faithandfireministries.co.za".repeat(100)));
});

test("sanitizeRedirectUrl falls back to production origin", () => {
  assert.equal(sanitizeRedirectUrl("https://evil.example.com"), "https://faithandfireministries.co.za");
  assert.equal(sanitizeRedirectUrl("javascript:alert(1)"), "https://faithandfireministries.co.za");
  assert.equal(sanitizeRedirectUrl(null), "https://faithandfireministries.co.za");
  assert.equal(sanitizeRedirectUrl(undefined), "https://faithandfireministries.co.za");
  assert.equal(
    sanitizeRedirectUrl("https://faithandfireministries.co.za/give", "https://faithandfireministries.co.za"),
    "https://faithandfireministries.co.za/give"
  );
});
/**
 * Utilities for rendering exact prototype HTML from `.example`.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

export type ExamplePage =
  | "index.html"
  | "login.html"
  | "events.html"
  | "event-single.html"
  | "event-featured.html"
  | "event-register.html"
  | "posts.html"
  | "post-single.html"
  | "about.html"
  | "services.html"
  | "knowledge.html"
  | "privacy.html"
  | "terms.html"
  | "forgot-password.html";

function replaceRouteLinks(html: string, locale: "ar" | "en") {
  const prefix = `/${locale}`;

  return html
    .replaceAll('href="index.html"', `href="${prefix}"`)
    .replaceAll('href="login.html"', `href="${prefix}/auth"`)
    .replaceAll('href="events.html"', `href="${prefix}/events"`)
    .replaceAll('href="event-single.html"', `href="${prefix}/events/sample-single"`)
    .replaceAll('href="event-featured.html"', `href="${prefix}/events/sample-featured"`)
    .replaceAll('href="event-register.html"', `href="${prefix}/events/sample/register"`)
    .replaceAll('href="posts.html"', `href="${prefix}/blog"`)
    .replaceAll('href="post-single.html"', `href="${prefix}/blog/sample-post"`)
    .replaceAll('href="about.html"', `href="${prefix}/about"`)
    .replaceAll('href="services.html"', `href="${prefix}/services"`)
    .replaceAll('href="knowledge.html"', `href="${prefix}/knowledge"`)
    .replaceAll('href="privacy.html"', `href="${prefix}/privacy"`)
    .replaceAll('href="terms.html"', `href="${prefix}/terms"`)
    .replaceAll('href="forgot-password.html"', `href="${prefix}/forgot-password"`)
    .replaceAll('src="assets/', 'src="/example-assets/')
    .replaceAll('href="assets/', 'href="/example-assets/');
}

export async function getExampleHtml(filename: ExamplePage, locale: "ar" | "en") {
  const sourcePath = path.join(process.cwd(), ".example", filename);
  const html = await readFile(sourcePath, "utf8");
  return replaceRouteLinks(html, locale);
}

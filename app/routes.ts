import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("svg-icon", "routes/svg-icon/page.tsx"),
  route("image-icon", "routes/image-icon/page.tsx"),
  route("line", "routes/line/page.tsx"),
  route("unibook-icon", "routes/unibook-icon/page.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;

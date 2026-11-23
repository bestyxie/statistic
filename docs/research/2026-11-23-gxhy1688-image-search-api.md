# gxhy1688.com 以图搜图接口研究报告

> 调研日期：2026-11-23。目标页面：`https://gxhy1688.com/Screening?marketCode=gz&sccreeingtype=3`（顶部搜索框左侧相机图标）。
> 结论均已通过抓包分析 + curl 复放实测验证。

## 一、功能入口与前端实现

页面是 Vue 2 + Element UI。搜索框 `.commdity_searchmo` 内嵌 `el-upload`：

```html
<el-upload class="upload-demo"
  :action="hostusl"                        <!-- = https://api.gxhy1688.com/personProduct/getImgSearchResultV2.action -->
  with-credentials
  :show-file-list="false"
  :before-upload="beforeAvatarUpload"
  :on-success="handleAvatarSuccess">
```

调用链（源码为压缩后还原，逻辑完整）：

1. **`beforeAvatarUpload(file)`** — 弹全屏 loading，调 `setimg(file)`。
2. **`setimg(file)`** — 本地 canvas 压缩：JPEG 用 `canvas.toBlob(cb, type, 0.15)`（quality 15/100）；PNG 走降位深编码（`256 * quality * 0.01` 位）；超高图按最大高度 20000px 等比缩放。纯前端，无外部 API。
3. **el-upload 原生 POST** — multipart/form-data，字段名 `file`，直传压缩后的图。首搜不传 `index`。
4. **`handleAvatarSuccess(res)`** — 取 `res.data.sortList` 渲染结果，并向父页面 `$emit("clickAvatar", sortList, rawFile)`。
5. **父页面 `uploadAvater`** — 置 `sccreeingtype=3`（URL 里的 `sccreeingtype=3` 即"图搜模式"）、`total=500`。
6. **翻页** — `initcreated()` 在图搜模式下用 axios 重放同一接口：FormData 里重新带上原始 `file` + `index=pageIndex`（每页重新上传一次图片）。

## 二、核心接口

### POST `https://api.gxhy1688.com/personProduct/getImgSearchResultV2.action`

| 项 | 值 |
|---|---|
| 方法 | POST，`Content-Type: multipart/form-data` |
| 字段 | `file`（图片文件，必填）；`index`（页码，0 起，可省略=第 0 页） |
| 鉴权 | **无**。无 cookie、无 token、无签名，裸 curl 可用 |
| 图片限制 | 长宽 ≥100px（小于时返回 `图片长或宽不能小于100PX`）；1x1 之类无效图会返回"服务器繁忙" |
| 响应耗时 | 实测约 1.3s（350KB 结果） |

响应结构：

```jsonc
{
  "encrypt": false,          // 此接口明文返回，不走站点通用的 wxt 加解密
  "code": null, "msg": null, "success": true,
  "data": {
    "region": ["624,1079,302,731", ...],  // 服务端识别的主体区域 x,y,w,h；前端实际未使用
    "sortList": [ ... ],                  // 商品数组，每页约 96-97 条
    "requestId": "..."
  }
}
```

`sortList` 单条商品关键字段：`id` / `title` / `description` / `price` / `address`（档口）/ `createdTime`（毫秒时间戳）/ `pictureCount` / `pics.picList[]`（商品图 URL 数组，托管在 `product.aliyizhan.com`，可直接外链）/ `sales` / `freeShip` 等（完整字段约 90 个，见 /tmp/response_v2.json 样例）。

翻页行为：`index` 递增返回不同结果（相邻页有少量重叠，图搜排序非严格分页）；超出可用页数时返回 `{"region":null,"sortList":null,"requestId":null}`，前端用 `||[]` 兜底。实测本图可用约 5-6 页。

### 相关但已下线/无关的接口（分析过程中排除）

- `/personProduct/searchPicWithFileV2.action`、`/personProduct/searchPicWithMarket.action` — 只在通用请求封装的 header 分支里出现，无调用点，旧版图搜。
- `/searchByAliyun/search` + `/searchByAliyun/searchAliyunPicWithMarketByClient` — 新版两段式流程（传图拿 imageList → 换结果），当前域名下 404，属另一部署（`gz.aliyizhan.com` 变体站）。
- `AliyunCaptcha`/`FeiLin`（SceneId `1orl5u03`，`phone/checkCaptchaSigned.action`）— 登录/短信验证流程用，与以图搜图无关。
- 站点大部分接口走自定义加密（请求 `Lt()` 加密、响应 `Dt()` 解密，Content-Type `application/wxt`），**图搜接口不在加密名单内**，直接明文 JSON。

## 三、CORS 约束（对本项目最关键）

`api.gxhy1688.com` 响应头为白名单制：

```
Access-Control-Allow-Origin: https://gxhy1688.com   (或 gz.aliyizhan.com，随请求 Origin 白名单匹配)
Access-Control-Allow-Credentials: true
```

仅 `gxhy1688.com`、`gz.aliyizhan.com` 在白名单，其余域名（含 `example.com` 测试）不放行。
**⇒ 本项目浏览器不能直连该接口，必须在服务端做代理转发。**

## 四、本项目实现建议

1. **服务端代理**：本项目后端加一个转发端点，浏览器把图片（建议先前端压缩，对标站点 quality≈0.15 的 JPEG，控制请求体积）POST 到自己的后端，后端以 multipart 转发 `file` + `index` 到 `getImgSearchResultV2.action`，原样透传 JSON。无需伪造 cookie/header（实测全不需要，但注意别带 `Origin` 也行）。
2. **前端组件**：按[组件封装原则](../frontend/component-principles.md)封装独立的 ImageSearch 组件——内部管理：文件选择/压缩、调代理接口、分页（index 递增，`sortList=null` 视为无更多页）、结果渲染；对外只暴露搜索结果与状态回调。
3. **图片预校验**：上传前校验长宽 ≥100px，避免拿到"服务器繁忙"这类无信息错误。
4. **翻页成本提醒**：原站每页翻页都重传整张图。若本项目也想翻页，两种做法：a) 同样重传（简单，与原站一致）；b) 首次结果后把图暂存在服务端会话/缓存，后续只传 index + 一个引用 key（省流量，但需要自己加一层）。
5. **合规与稳定性**：该接口非公开 API，无 SLA、随时可能加鉴权或加密（站点已有 wxt 加密体系，图搜暂未纳入）。建议代理层做好超时（原站前端设 8s）、失败兜底与错误码透传，并关注其前端 bundle 版本号（当前 `32802404`）变化以便及时发现接口变更。

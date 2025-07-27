# 📘 Chasing Chapters — Product Requirements Document (PRD)

## 🎯 Overview

**Chasing Chapters** is a personal book review platform for my wife, built as a **combined web app** using **Next.js** and **Payload CMS** in a single project. The app allows for review publishing via a custom admin panel with plans for future Instagram integration. It uses **PostgreSQL** as the primary database and **Cloudflare R2** for storing media files.

---

## 🎯 Target MVP (Phase 1)

- Author can log into Payload CMS admin panel and publish book reviews with enhanced metadata (title, author, rating, tags, excerpt, reading progress, book details)
- Book search integration with Google Books API for auto-populating book metadata
- Public website displays list of published reviews with excerpts and individual review pages  
- Tag-based search and filtering functionality for reviews
- Browse reviews by genre/category tags
- Reading progress tracking (Want to Read, Currently Reading, Finished)
- Reviews include SEO metadata for better search ranking  
- Use PostgreSQL for data and Cloudflare R2 for image/media storage  
- Single unified Next.js + Payload CMS app, deployed to a suitable hosting platform  

---

## 🧱 Core Features

### 1. Enhanced Review Publishing (Payload CMS)
- Admin panel (`/admin`) built with Payload CMS
- Authors can:
  - Search and select books via Google Books API integration
  - Auto-populate book metadata (title, author, cover image, page count, genre, publish year, ISBN)
  - Create/edit reviews with rich content and excerpt
  - Set reading status (Want to Read, Currently Reading, Finished)
  - Add personal rating, tags, and reading dates
  - Upload custom cover image if needed (stored in Cloudflare R2)
  - Set publish date and status (draft/published)

### 2. Public Website (Next.js)
- Home page with recent reviews (showing excerpts and reading status)
- Individual review pages (`/reviews/:slug`) with full content and book metadata
- Tag browsing page (`/tags/:slug`) with filtered reviews
- Search functionality with tag filtering
- Reading progress pages (Currently Reading, Want to Read lists)
- Static pages (About, Contact)
- Responsive UI with Tailwind CSS
- SEO optimized (meta, Open Graph, sitemap with excerpts)

### 3. Tagging & Search System
- Create and manage tags through Payload CMS
- Associate multiple tags with each review
- Tag-based filtering and search functionality
- Browse all reviews by specific tag/genre
- Tag cloud or category navigation

### 4. Book Search Integration
- Google Books API integration for book discovery
- Auto-populate book metadata (title, author, cover, page count, genre, year, ISBN)
- Search and select books during review creation
- Fallback to manual entry if book not found
- Reduce manual data entry and improve accuracy

### 5. SEO & Metadata
- Open Graph meta tags for social sharing (with excerpts)
- Structured data for search engines (Book, Review schema)
- XML sitemap generation
- Optimized page titles and descriptions

---

## 🔧 Tech Stack

| Layer            | Technology                              |
|------------------|------------------------------------------|
| Web App          | Next.js + Payload CMS (monorepo)         |
| CMS              | Payload CMS 3.0 (Next.js native)         |
| Frontend         | Next.js 14+ App Router                   |
| Database         | PostgreSQL                               |
| Media Storage    | Cloudflare R2                            |
| Styling          | Tailwind CSS                             |
| Book Data        | Google Books API                         |
| Hosting          | VPS          |

---

## 🏗️ Architecture

- `/app`: Next.js pages and API routes
- `/admin`: Payload CMS UI
- `/api/books/search`: Google Books API integration endpoint
- `payload.config.ts`: Collections, access, and hooks
- Shared `.env` config for DB, R2, and Google Books API

---

## 🔐 Roles

| Role         | Responsibility                                 |
|--------------|------------------------------------------------|
| Developer    | Build and maintain app, configure CMS & API    |
| Author       | Write and publish reviews through Payload admin|

---

---

## 🗃️ Data Schema

### `reviews` Collection
- `title`: text (book title)
- `slug`: auto-generated, unique
- `author`: text (book author)
- `excerpt`: text (short summary for lists and SEO)
- `rating`: number (1–5, allow half stars)
- `tags`: relationship to `tags` collection (many-to-many)
- `coverImage`: upload (Cloudflare R2)
- `content`: richText (full review content)
- `readingStatus`: select (`want-to-read`, `currently-reading`, `finished`)
- `dateStarted`: date (optional)
- `dateFinished`: date (optional)
- `publishedDate`: date
- `status`: select (`draft`, `published`)
- **Book Metadata (from Google Books API):**
  - `pageCount`: number
  - `genre`: text
  - `publishYear`: number
  - `isbn`: text
  - `googleBooksId`: text (for future reference)

### `tags` Collection
- `name`: text (unique, required)
- `slug`: auto-generated, unique
- `description`: text (optional)
- `color`: text (hex color for UI styling)
- `status`: select (`active`, `inactive`)

---

## 🔮 Future Features (Phase 2+)

### Instagram Auto-Posting Integration
- Triggered when a review is published
- Custom `afterChange` hook in Payload CMS
- Uploads image and caption to Instagram Creator account via Graph API
- **Requirements:** Instagram Creator Account, Facebook Page, Facebook Developer App, Long-lived Page Access Token

### Additional Enhancements
- Comments system (Disqus or custom)
- Advanced search with full-text search capabilities
- Newsletter integration
- Analytics (Plausible or GA4)
- Advanced tag management (tag suggestions, trending tags)
- Advanced social sharing features
- Reading lists or favorites functionality

---

## 🚀 Deployment Plan

| Component        | Hosting Option            |
|------------------|----------------------------|
| Web App          | VPS  |
| Database         | PostgreSQL (VPS) |
| Media Storage    | Cloudflare R2              |
| Domain           | TBD       |

---

## ✅ Success Criteria (Phase 1 MVP)

- [ ] Author can easily manage reviews in Payload CMS admin panel
- [ ] Google Books API integration allows searching and auto-populating book metadata
- [ ] Reviews can be created with enhanced fields (title, author, excerpt, rating, tags, content, reading status, dates)
- [ ] Tags can be created and managed through admin panel
- [ ] Reading progress tracking (Want to Read, Currently Reading, Finished) works correctly
- [ ] Public website displays list of published reviews with excerpts and individual review pages
- [ ] Review pages show complete book metadata and reading information
- [ ] Tag-based search and filtering functionality works correctly
- [ ] Users can browse reviews by specific tags/genres
- [ ] Reading progress pages show current and planned reads
- [ ] Tag pages show all reviews associated with that tag
- [ ] Website loads quickly and looks great on all devices (responsive design)
- [ ] SEO metadata with excerpts is properly implemented for search engine optimization
- [ ] PostgreSQL database and Cloudflare R2 storage are working correctly
- [ ] Hosting is reliable and cost-effective

## ✅ Success Criteria (Phase 2 - Future)

- [ ] Instagram auto-posts are triggered when reviews are published
- [ ] Posts are properly formatted with image and caption
- [ ] Social media integration works reliably

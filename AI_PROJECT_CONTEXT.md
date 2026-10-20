# Phone Accessories Catalogue

## Purpose

Internal web application for managing and viewing
phone accessories in a retail shop.

## Technology

- Next.js
- TypeScript
- Tailwind CSS
- MongoDB
- Mongoose
- Cloudflare hosting

## Authentication

Users must login before accessing the catalogue.

Roles:

ADMIN
STAFF

ADMIN:
- Add product
- Edit product
- Delete product
- Manage categories
- Manage brands
- Manage users

STAFF:
- View products
- Search products
- Filter products
- Add products
- Edit products

## Product

A product contains:

- name
- category
- brand
- SKU
- price
- MRP
- images
- description
- specifications
- compatibility
- warranty
- createdAt
- updatedAt

## Categories

Examples:

- Chargers
- USB Cables
- Mobile Covers
- Tempered Glass
- Earphones
- Bluetooth Speakers
- Power Banks
- Adapters
- Mobile Stands
- Memory Cards
- Smart Watches
- Other Accessories

## Important rules

- Do not use TypeScript.
- Use MongoDB with Mongoose.
- Use reusable components.
- Keep UI responsive.
- Do not add unnecessary packages.
- Use server-side validation.
- Use pagination for product listing.
- Use MongoDB indexes for search.
- Do not store image binaries in MongoDB.
- Keep code production-ready.
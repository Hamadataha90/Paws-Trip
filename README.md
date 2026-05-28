<div align="center">
  <img src="public/logo.png" alt="Paws-Trip Logo" width="120" />
  <h1>🐾 Paws-Trip</h1>
  <p><strong>Your Pet's Travel Companion</strong></p>
  <p>
    <a href="#-about-the-project">About</a> •
    <a href="#-key-features">Features</a> •
    <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-project-structure">Structure</a>
  </p>
</div>

---

## 📖 About The Project

**Paws-Trip** is a modern, premium e-commerce platform dedicated to pet travel comfort. Because every pet deserves a first-class journey, we offer a curated selection of airline-approved carriers, ergonomic travel gear, and adorable travel accessories to make every adventure safe, stylish, and stress-free.

## ✨ Key Features

- 🛍️ **Premium E-commerce Experience**: Browse, search, and securely checkout premium pet travel gear.
- 🌓 **Dark Mode Support**: Seamless user experience with beautiful Light and Dark themes.
- 🚀 **Next.js 15 App Router**: Leveraging the latest features of Next.js for blazing fast performance and SEO.
- 🛒 **Robust State Management**: Powered by Redux for smooth cart and user state handling.
- 🎨 **Modern & Interactive UI**: Crafted with Bootstrap 5, custom CSS, and fluid animations using Framer Motion.
- 🗄️ **Serverless Database**: Integrated with Prisma ORM and PostgreSQL (Neon/Vercel Postgres) for scalable data management.
- 📊 **Built-in Analytics**: Integrated with Vercel Analytics to track usage and performance.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Bootstrap 5](https://getbootstrap.com/), Custom CSS, [Framer Motion](https://www.framer.com/motion/)
- **Database**: [PostgreSQL](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/)
- **State Management**: [Redux](https://redux.js.org/) & React-Redux
- **Icons**: [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/)
- **Deployment**: [Vercel](https://vercel.com/)

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Ensure you have the following installed:
- Node.js (v18.17 or higher)
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/paws-trip.git
   cd paws-trip
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or yarn install / pnpm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and configure your database and necessary secrets:
   ```env
   # Database connection string (PostgreSQL)
   DATABASE_URL="postgres://user:password@host/database"
   # Add other required keys based on your specific integrations
   ```

4. **Initialize Prisma (Database Setup)**
   ```bash
   npx prisma generate
   npx prisma db push
   # or npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Explore the app**
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```text
paws-trip/
├── app/
│   ├── api/               # Next.js API routes
│   ├── checkout/          # Checkout flow and logic
│   ├── orders/            # Order history and management
│   ├── products/          # Product listing and details
│   ├── sharedcomponent/   # Reusable UI components (NavBar, Footer, Slider, etc.)
│   ├── track/             # Order tracking
│   ├── globals.css        # Global styles and theme variables
│   ├── layout.js          # Root layout including providers
│   └── page.js            # Main landing page
├── prisma/                # Prisma schema and migrations
├── public/                # Static assets (images, fonts, icons)
└── ...config files        # next.config.mjs, package.json, etc.
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License.

---
<div align="center">
  <i>Built with ❤️ for pets and their humans.</i>
</div>

# Alembic Endometriosis Awareness Month Application

## Pages

This application contains two main pages:

### 1. Home Page (`/`)
- Employee code login form
- Displays EAM logo
- Clicking "Login" navigates to Verify Details page

### 2. Verify Details Page (`/verify-details`)
- Form with multiple fields:
  - Employee ID
  - Name
  - Designation
  - HQ
  - Region
- Has "Back" and "Login" buttons
- "Back" button returns to home page

## Navigation

- Use the **hamburger menu** (top-right) to navigate between pages
- Click on "Home" or "Verify Details" in the side menu
- The side menu slides in smoothly from the right
- Click outside the menu or the X button to close it

## Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5174/`

## Features

- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Bootstrap styling and layout
- ✅ Smooth sliding side menu
- ✅ Gradient background matching design
- ✅ Form validation support
- ✅ React Router for navigation
- ✅ TypeScript for type safety

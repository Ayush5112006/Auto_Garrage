# Auto Garage Booking System - Features & User Flow

## 🎯 Overview
Complete frontend-only Auto Garage Booking System with guest booking, tracking, and optional login functionality. All prices are in **Indian Rupees (₹)**.

## 🚀 Key Features

### 1. **Landing Page** (`/`)
- Hero section with search functionality
- Featured services with Indian pricing
- Why Choose Us section
- Customer testimonials
- Call-to-Action sections

### 2. **Garage Listing** (`/garages`)
- Browse all available garages
- Search by garage name or location
- View garage ratings and reviews
- See services offered by each garage
- Check opening hours and contact info

### 3. **Garage Detail** (`/garage/:id`)
- Complete garage information
- Full service list with pricing in ₹
- Customer reviews section
- Contact details and hours
- Direct booking button

### 4. **Booking System** (`/booking`)
- Guest booking without login
- Select multiple services
- Choose preferred date and time
- Enter customer details (name, email, phone, vehicle info)
- **Automatic Tracking ID Generation** (Format: `GAR-XXXXXX`)
- Success screen with Tracking ID
- Optional login prompt after booking
- All prices in Indian Rupees

### 5. **Tracking System** (`/track`)
- Enter Tracking ID to check booking status
- View all booking details:
  - Services selected with prices in ₹
  - Appointment date and time
  - Customer information
  - Total amount
- Status badges:
  - **Pending** (Yellow)
  - **Confirmed** (Blue)
  - **In Progress** (Purple)
  - **Completed** (Green)
- Data persisted in browser localStorage

### 6. **Authentication**
- **Login Page** (`/login`) - Redesigned with Tailwind CSS
  - Email and password input
  - Show/hide password toggle
  - Option to continue as guest
  - Link to register
- **Registration Page** (`/register`) - Existing implementation
- **Dashboard** (`/dashboard`) - New page for logged-in users

### 7. **User Dashboard** (`/dashboard`)
- View profile information
- Booking history with status
- Track individual bookings
- Quick action buttons
- Logout functionality

## 💰 Pricing (All in Indian Rupees)

| Service | Price |
|---------|-------|
| Oil Change | ₹2,499 |
| Engine Repair | ₹9,999 |
| Brake Service | ₹4,499 |
| Car Wash & Detail | ₹1,499 |
| AC Service | ₹3,999 |
| Tire Services | ₹1,999 |

## 🔄 User Flow

### As a Guest User:
```
1. Visit Home Page
   ↓
2. Browse Garages (optional)
   ↓
3. View Garage Details (optional)
   ↓
4. Book Service → Fill Form
   ↓
5. Confirm Booking
   ↓
6. Get Tracking ID (e.g., GAR-ABC123DEF)
   ↓
7. Track Booking using Tracking ID
   ↓
8. (Optional) Login to Save Booking
```

### As a Registered User:
```
1. Login with credentials
   ↓
2. Access Dashboard with booking history
   ↓
3. Browse garages and services
   ↓
4. Book service (auto-linked to profile)
   ↓
5. View all bookings in dashboard
   ↓
6. Track bookings anytime
```

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.tsx (Updated with new links)
│   ├── Hero.tsx (Updated CTA)
│   ├── CTASection.tsx (Updated with login/dashboard links)
│   ├── Services.tsx (Updated with ₹ pricing)
│   └── ... other components
├── pages/
│   ├── Index.tsx (Home)
│   ├── Booking.tsx (Updated - INR, Tracking ID, localStorage)
│   ├── Track.tsx (NEW - Tracking page)
│   ├── GarageListing.tsx (NEW - Browse garages)
│   ├── GarageDetail.tsx (NEW - Garage details)
│   ├── Login.tsx (Updated - Tailwind styling)
│   ├── Dashboard.tsx (NEW - User dashboard)
│   ├── Register.tsx (Existing)
│   └── ... other pages
├── lib/
│   ├── currency.ts (INR formatting support)
│   └── api.ts
├── hooks/
│   └── ... custom hooks
└── App.tsx (Updated - New routes)
```

## 🌐 Available Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Index | Landing page |
| `/garages` | GarageListing | Browse all garages |
| `/garage/:id` | GarageDetail | Garage details |
| `/booking` | Booking | Book service (guest or user) |
| `/track` | Track | Track booking with Tracking ID |
| `/login` | Login | User login |
| `/register` | Register | User registration |
| `/dashboard` | Dashboard | User's personal dashboard |
| `/services` | ServicesPage | Services listing |
| `/about` | About | About page |
| `/contact` | Contact | Contact page |

## 💾 Data Storage

### Local Storage Keys:
- **`bookings`**: Array of all bookings (guest + user)
  ```json
  [{
    "trackingId": "GAR-XXXXXX",
    "name": "Customer Name",
    "email": "email@example.com",
    "phone": "9876543210",
    "vehicle": "Car Model",
    "services": [{"id": "oil-change", "name": "Oil Change", "price": 2499}],
    "date": "2026-01-25",
    "time": "10:00 AM",
    "total": 2499,
    "status": "Pending",
    "createdAt": "2026-01-25T10:30:00Z"
  }]
  ```
- **`lastTrackingId`**: Latest tracking ID for quick reference
- **`authToken`**: User authentication token
- **`user`**: Logged-in user information

## 🎨 Currency

All prices displayed in **Indian Rupees (₹)**:
- ₹2,499 for Oil Change
- ₹1,499 for Car Wash
- ₹9,999 for Engine Repair
- etc.

## ✨ Features Highlight

✅ **Guest Booking** - No login required to book  
✅ **Tracking System** - Track orders with Tracking ID  
✅ **Offline Support** - Uses localStorage for persistence  
✅ **Responsive Design** - Works on all devices  
✅ **Modern UI** - Built with Tailwind CSS & shadcn/ui  
✅ **Indian Pricing** - All in ₹  
✅ **Optional Login** - Register later if you want  
✅ **Garage Discovery** - Browse and compare services  

## 🔧 Technologies Used

- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Router** - Navigation
- **Axios** - HTTP requests (for future API integration)
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install axios
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open browser to `http://localhost:5173`

## 📝 Notes

- All data is stored locally in the browser (localStorage)
- PHP API endpoints available at `/php-api/` for future backend integration
- Tracking IDs are randomly generated and unique
- Bookings persist across browser sessions
- Status updates would come from backend API integration

---

**Built with ❤️ for Auto Garage Booking System**

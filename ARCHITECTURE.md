# Project Structure Documentation

This document explains the modular architecture of the Arabic QR/Barcode Scanner application.

## 📁 Project Structure

```
src/
├── components/           # React Components
│   ├── BarcodeScanner.tsx   # Main scanner component
│   ├── Header.tsx           # App header with title
│   ├── CameraFrame.tsx      # Camera video frame with scanning overlay
│   ├── StatusOverlay.tsx    # Loading/success/error overlays
│   ├── StatusMessage.tsx    # Status messages and retry buttons
│   ├── ScanningTips.tsx     # User tips component
│   └── index.ts            # Component exports
├── hooks/               # Custom React Hooks
│   └── useBarcodeScanner.ts # Main scanning logic hook
├── types/               # TypeScript type definitions
│   └── index.ts            # Shared types and interfaces
├── App.tsx             # Main app component
├── main.tsx            # App entry point
└── index.css           # Global styles with Arabic fonts
```

## 🧩 Component Architecture

### Main Components

#### `BarcodeScanner` (Main Container)
- Orchestrates all sub-components
- Uses `useBarcodeScanner` hook for logic
- Handles component composition and layout

#### `Header`
- Displays app title and subtitle
- Responsive typography for mobile/desktop
- Arabic text support

#### `CameraFrame`
- Renders video element for camera feed
- Shows scanning frame with animated corners
- Displays scanning line animation

#### `StatusOverlay`
- Shows loading, success, and error states
- Animated icons and messages
- Backdrop blur effects

#### `StatusMessage`
- Displays status text below camera
- Retry buttons for error states
- Contextual help messages

#### `ScanningTips`
- User guidance for optimal scanning
- Icon-based tips with Arabic text
- Responsive card layout

### Custom Hooks

#### `useBarcodeScanner`
- Encapsulates all scanning logic
- Manages camera access and permissions
- Handles QR/barcode detection
- URL validation and redirection
- Error handling and cleanup

### Types

#### Shared TypeScript Interfaces
- `ScanState`: Scanner status and message state
- `BarcodeScannerProps`: Main component props
- Component-specific prop interfaces
- Hook parameter interfaces

## 🔄 Data Flow

1. **App.tsx** → Provides callbacks to `BarcodeScanner`
2. **BarcodeScanner** → Uses `useBarcodeScanner` hook
3. **useBarcodeScanner** → Manages all scanner logic and state
4. **Components** → Receive state and display UI accordingly

## 🎨 Styling Architecture

- **Tailwind CSS 4**: Utility-first styling
- **RTL Support**: Full right-to-left layout
- **Dark Mode**: Automatic system preference detection
- **Responsive Design**: Mobile-first approach
- **Arabic Typography**: Noto Kufi Arabic font

## 🔧 Benefits of This Architecture

### ✅ **Maintainability**
- Single responsibility principle
- Clear separation of concerns
- Easy to modify individual components

### ✅ **Reusability**
- Components can be used independently
- Hook can be reused in other contexts
- Shared types ensure consistency

### ✅ **Testability**
- Each component can be tested in isolation
- Hook logic separated from UI
- Mock-friendly interfaces

### ✅ **Scalability**
- Easy to add new features
- Simple to extend existing components
- Type-safe development

## 🚀 Development Guidelines

### Adding New Features
1. Create new component in `components/`
2. Add types to `types/index.ts`
3. Export from `components/index.ts`
4. Update main component if needed

### Modifying Scanner Logic
- Edit `useBarcodeScanner.ts` hook
- Types are automatically shared
- UI components will reflect changes

### Styling Changes
- Use Tailwind utility classes
- Maintain RTL compatibility
- Test in both light/dark modes
- Ensure mobile responsiveness

## 📱 Mobile Optimization

- Touch-friendly button sizes
- Optimized camera resolution
- Efficient re-renders
- Smooth animations
- Network-aware loading

## 🌐 Internationalization Ready

- Centralized text content
- RTL layout support
- Arabic font optimization
- Cultural design considerations
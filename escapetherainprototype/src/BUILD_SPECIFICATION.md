# Escape the Rain - Complete Build Specification

## Overview
"Escape the Rain" is a weather app that helps users find nearby dry destinations when it's raining. The app features two distinct states: an **Empty State** (before location selection) and a **Results State** (after location selection), connected by smooth, choreographed transitions.

---

## Design System

### Typography
- **Font Family**: Inter (Google Fonts)
  - Fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif
- **Base Font Size**: 14px
- **Font Weights**: 
  - Normal: 400
  - Medium: 500
  - Bold: 700 (for primary button)

### Color Palette
```css
--background: #ffffff
--foreground: oklch(0.145 0 0)
--primary: #030213
--secondary: oklch(0.95 0.0058 264.53)
--muted-foreground: #717182
--border: rgba(0, 0, 0, 0.1)
--input-background: #f3f3f5
```

### Key UI Elements
- **Blue Gradient Background**: `from-blue-50 to-background`
- **Primary Button**: Blue-600 background (`bg-blue-600 hover:bg-blue-700`)
- **Border Radius**: 0.625rem (10px)
- **Card Shadow on Hover**: `hover:shadow-md`

---

## App Structure

### File Organization
```
/App.tsx (main component)
/components/
  - LocationSelector.tsx
  - EmptyState.tsx
  - DestinationCard.tsx
  - MapView.tsx
  - Footer.tsx
/styles/globals.css
```

---

## State Management

### Main State Variables (in App.tsx)
```typescript
const [selectedLocation, setSelectedLocation] = useState('');
const [isExiting, setIsExiting] = useState(false);
```

### Location Selection Handler
```typescript
const handleLocationSelect = (location: string) => {
  setIsExiting(true);
  setTimeout(() => {
    setSelectedLocation(location);
    setIsExiting(false);
  }, 150); // Matches exit animation duration
};
```

### Mock Data (5 destinations)
```typescript
const MOCK_DESTINATIONS: Destination[] = [
  {
    id: 1,
    name: 'Whittlesford',
    distance: '38.2km',
    weatherStatus: 'Dry all day',
    thingsToDo: ['attractions', 'cafes', 'forests', 'museums', 'nature reserves']
  },
  {
    id: 2,
    name: 'Cambridge',
    distance: '42.1km',
    weatherStatus: 'Dry all day',
    thingsToDo: ['museums', 'universities', 'punting', 'shopping', 'dining']
  },
  {
    id: 3,
    name: 'Saffron Walden',
    distance: '45.8km',
    weatherStatus: 'Dry all day',
    thingsToDo: ['gardens', 'historic sites', 'markets', 'cafes', 'walks']
  },
  {
    id: 4,
    name: 'Colchester',
    distance: '52.3km',
    weatherStatus: 'Dry all day',
    thingsToDo: ['castle', 'zoo', 'museums', 'parks', 'restaurants']
  },
  {
    id: 5,
    name: 'Bury St Edmunds',
    distance: '58.7km',
    weatherStatus: 'Dry all day',
    thingsToDo: ['abbey', 'gardens', 'theatre', 'shopping', 'pubs']
  }
];
```

---

## Empty State (Pre-Selection)

### Layout Structure
Full-screen layout with 4 evenly distributed components using flexbox:

```tsx
<div className={`min-h-screen flex flex-col ${isExiting ? 'animate-fade-out-up' : ''}`}>
  {/* Component 1: Title + Subtitle */}
  {/* Component 2: Location Selector */}
  {/* Component 3: Animation */}
  {/* Component 4: Footer */}
</div>
```

### Component 1: Title + Subtitle
- **Container**: `flex items-center justify-center h-full flex-1`
- **Background**: `bg-gradient-to-b from-blue-50 to-background`
- **Padding**: `pt-[75px] pr-[28px] pb-[0px] pl-[28px]`
- **Title**: 
  - Text: "Escape the rain"
  - Size: `text-[36px] md:text-[40px]`
  - Weight: `font-semibold`
  - Margin bottom: `mb-3`
- **Subtitle**:
  - Text: "Too wet go outside? Find the nearest places where it's dry"
  - Size: `text-[16px]`
  - Color: `text-muted-foreground`
  - Max width: `max-w-2xl mx-auto`

### Component 2: Location Selector
- **Container**: `px-[28px] flex items-center justify-center h-full flex-1 py-[0px]`
- **Width**: `lg:w-1/2 lg:mx-auto` (centered, half-width on desktop)

#### Primary Action: "Use my location" Button
- **Size**: Large (`size="lg"`)
- **Height**: `h-12`
- **Padding**: `px-8`
- **Background**: `bg-blue-600 hover:bg-blue-700`
- **Text**: "Use my location" with MapPin icon
- **Font**: `font-bold text-[16px]`
- **Text color**: White
- **Icon**: MapPin from lucide-react (`size-5`)
- **Behavior**: Sets location to 'Braintree, England, United Kingdom'

#### Divider
- Full-width border with centered text "or search"
- Text: `text-muted-foreground`
- Background: `bg-background px-4`

#### Search Input + Button
- **Layout**: Horizontal flex with gap-2
- **Input**:
  - Type: text
  - Placeholder: "Enter any location..."
  - Icon: Search icon (`size-4`) positioned absolutely at left
  - Padding left: `pl-10` (to accommodate icon)
  - Background: `bg-input-background`
  - Border: `border-border`
  - Height: `h-10`
- **Button**:
  - Variant: secondary
  - Text: "Search"
  - Height: `h-10`
  - Shrink: `shrink-0`

### Component 3: EmptyState Animation
- **Container**: `px-4 flex items-center justify-center h-full flex-1 mt-[0px] mr-[0px] mb-[40px] ml-[0px]`

#### Animation Details
```tsx
<div className="flex flex-col items-center justify-center px-4 text-center">
  <div className="relative w-64 h-64">
    {/* Rain cloud - top left */}
    <div className="absolute top-0 left-0 opacity-40">
      <AnimatedRainCloud className="text-blue-400" size={85} />
    </div>
    
    {/* Sun - center, spinning */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <Sun className="size-32 text-yellow-500 animate-spin opacity-100" 
           style={{ animationDuration: '20s' }} />
    </div>
    
    {/* Rain cloud - top right */}
    <div className="absolute top-8 opacity-30" style={{ right: '-25px' }}>
      <AnimatedRainCloud className="text-blue-400" size={106} />
    </div>
    
    {/* Gray cloud - bottom left, pulsing */}
    <div className="absolute bottom-4 left-4 animate-pulse opacity-20" 
         style={{ animationDelay: '2s' }}>
      <Cloud className="size-20 text-gray-400" />
    </div>
  </div>
</div>
```

#### AnimatedRainCloud Component
Custom component with cloud icon and 3 animated rain lines:
```tsx
<div className="relative" style={{ width: `${size}px`, height: `${size * 1.4}px` }}>
  <Cloud className="absolute top-0 left-0" style={{ width: `${size}px`, height: `${size}px` }} />
  
  <svg className="absolute" 
       style={{ top: `${size * 0.85}px`, left: 0, width: `${size}px`, height: `${size * 0.6}px` }}
       viewBox="0 0 100 40">
    {/* 3 rain lines with staggered pulse animation */}
    <line x1="25" y1="0" x2="25" y2="20" stroke="currentColor" 
          strokeWidth="6" strokeLinecap="round" className="rain-line-1" />
    <line x1="75" y1="0" x2="75" y2="20" stroke="currentColor" 
          strokeWidth="6" strokeLinecap="round" className="rain-line-2" />
    <line x1="50" y1="5" x2="50" y2="25" stroke="currentColor" 
          strokeWidth="6" strokeLinecap="round" className="rain-line-3" />
  </svg>
</div>
```

**Rain Pulse Animation** (in globals.css):
```css
@keyframes rainPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.rain-line-1 { animation: rainPulse 2s ease-in-out infinite; }
.rain-line-2 { animation: rainPulse 2s ease-in-out infinite; animation-delay: 0.66s; }
.rain-line-3 { animation: rainPulse 2s ease-in-out infinite; animation-delay: 1.33s; }
```

### Component 4: Empty State Footer
- **Position**: Bottom of screen (not sticky)
- **Padding**: `px-4 py-4`
- **Border**: `border-t border-border`
- **Text**: `text-[10px] text-muted-foreground`
- **Background**: `bg-background`
- **Content**: 
  - "Weather data from [Open-Meteo](https://open-meteo.com)"
  - " • "
  - "Places from [OpenTripMap](https://opentripmap.io)"
  - " • "
  - "Maps by [OpenStreetMap](https://www.openstreetmap.org)"
- **Link styling**: `text-primary hover:underline`

---

## Results State (Post-Selection)

### Layout Structure
```tsx
<div className="w-full flex flex-col flex-1">
  {/* Compact Header with collapsed location selector */}
  {/* Main Content: Two-column layout (desktop) / Stacked (mobile) */}
</div>
```

### Compact Header
- **Background**: `bg-gradient-to-b from-blue-50 to-background`
- **Padding**: `py-4 px-4`
- **Border**: `border-b border-border`
- **Animation**: `animate-slide-down` (slides down from top in 0.6s)
- **Max width**: `max-w-7xl mx-auto`

#### Collapsed Location Selector
```tsx
<div className="flex items-center justify-center gap-2 py-2">
  <MapPin className="size-4 text-muted-foreground" />
  <span className="text-sm text-muted-foreground">Location:</span>
  <span className="text-sm font-medium">{selectedLocation}</span>
  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
    <Edit2 className="size-3 mr-1" />
    Edit
  </Button>
</div>
```
- **Edit button behavior**: Expands back to full location selector
- **Transition**: `transition-all duration-300`

### Main Content Container
- **Max width**: `max-w-7xl mx-auto`
- **Padding**: `px-4 w-full py-6`
- **Animation**: `animate-slide-up` with `style={{ animationDelay: '0.15s' }}`
- **Grid**: `grid grid-cols-1 lg:grid-cols-2 gap-8`

### Left Column: Destinations List
- **Order**: `order-2 lg:order-1` (appears second on mobile, first on desktop)
- **Heading**: "Dry destinations nearby" (`h2 mb-5`)
- **Spacing**: `space-y-4` between cards

#### Destination Cards
Each card has staggered animation:
```tsx
<div className="animate-fade-in-up" 
     style={{ animationDelay: `${0.4 + index * 0.1}s` }}>
  <DestinationCard destination={destination} />
</div>
```

**DestinationCard Component**:
```tsx
<Card className="p-5 hover:shadow-md transition-shadow">
  <div className="space-y-3">
    {/* Header with name, distance, and "Open in Maps" button */}
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <h3 className="font-medium text-lg">{destination.name}</h3>
        <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
          <MapPin className="size-3.5" />
          <span className="text-sm">{destination.distance} away</span>
        </div>
      </div>
      <Button size="sm">Open in Maps</Button>
    </div>
    
    {/* Weather status */}
    <div className="flex items-center gap-2 text-sm">
      <Sun className="size-4 text-yellow-500" />
      <span className="font-medium">{destination.weatherStatus}</span>
    </div>
    
    {/* Things to do tags */}
    <div className="pt-2 border-t">
      <p className="text-sm text-muted-foreground mb-2">Things to do:</p>
      <div className="flex flex-wrap gap-2">
        {destination.thingsToDo.map((thing, index) => (
          <span key={index} 
                className="text-xs px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full">
            {thing}
          </span>
        ))}
      </div>
    </div>
  </div>
</Card>
```

### Right Column: Map
- **Order**: `order-1 lg:order-2` (appears first on mobile, second on desktop)
- **Heading**: "Map" (`h2 mb-5`)
- **Container**: 
  - Mobile: `h-[400px]`
  - Desktop: `h-[600px] lg:sticky lg:top-8` (sticky positioning)
- **Animation**: `animate-fade-in-up` with `style={{ animationDelay: '0.3s' }}`

#### MapView Component
```tsx
<div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-border relative overflow-hidden">
  {/* Grid pattern background */}
  <div className="absolute inset-0 opacity-20">
    <svg className="w-full h-full">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
  
  {/* Markers container */}
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative w-4/5 h-4/5">
      {/* Current location marker (blue pulsing dot) */}
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 z-20">
        <div className="relative">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          <div className="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping"></div>
        </div>
      </div>
      
      {/* Destination markers (first 3 destinations only) */}
      {/* Position A (20% top, 30% left) */}
      {/* Position B (15% top, 25% right) */}
      {/* Position C (40% top, 20% right) */}
      <div className="w-8 h-8 bg-red-500 rounded-full border-3 border-white shadow-lg 
                      flex items-center justify-center text-white font-bold text-xs">
        {/* Letter: A, B, C */}
      </div>
      <div className="mt-1 text-xs bg-white px-2 py-0.5 rounded shadow text-center 
                      font-medium max-w-[100px] truncate">
        {/* Destination name */}
      </div>
    </div>
  </div>
  
  {/* Attribution */}
  <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground 
                  bg-white/80 px-2 py-1 rounded">
    Maps © OpenStreetMap
  </div>
</div>
```

### Results State Footer
- **Margin top**: `mt-12`
- **Padding**: `pt-6`
- **Border**: `border-t border-border`
- **Text**: `text-sm text-muted-foreground` (larger than empty state footer)
- **Animation**: `animate-fade-in` with `style={{ animationDelay: '1s' }}`
- **Content**: Same as empty state footer but with normal text size

---

## Transition Animations

### Exit Animation (Empty State → Results State)
**Timing**: 150ms  
**Applied to**: Entire empty state container when `isExiting === true`

```css
@keyframes fadeOutUp {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px);
  }
}

.animate-fade-out-up {
  animation: fadeOutUp 0.15s ease-out forwards;
  animation-fill-mode: both;
}
```

### Entrance Animations (Results State)

#### 1. Slide Down (Header)
**Timing**: 600ms  
**Delay**: 0ms  
**Applied to**: Compact header

```css
@keyframes slideDownFromTop {
  0% {
    opacity: 0;
    transform: translateY(-30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  opacity: 0;
  animation: slideDownFromTop 0.6s ease-out forwards;
  animation-fill-mode: both;
}
```

#### 2. Slide Up (Main Content Container)
**Timing**: 750ms  
**Delay**: 150ms  
**Applied to**: Main content wrapper

```css
@keyframes slideUpFromBottom {
  0% {
    opacity: 0;
    transform: translateY(60px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  opacity: 0;
  animation: slideUpFromBottom 0.75s ease-out forwards;
  animation-fill-mode: both;
}
```

#### 3. Fade In Up (Map and Cards)
**Timing**: 525ms  
**Delay**: 
- Map: 300ms
- Card 1: 400ms
- Card 2: 500ms
- Card 3: 600ms
- Card 4: 700ms
- Card 5: 800ms

```css
@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.525s ease-out forwards;
  animation-fill-mode: both;
}
```

#### 4. Fade In (Footer)
**Timing**: 600ms  
**Delay**: 1000ms

```css
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.animate-fade-in {
  opacity: 0;
  animation: fadeIn 0.6s ease-out forwards;
  animation-fill-mode: both;
}
```

### Animation Choreography Timeline
```
0ms:    User clicks location selector
0ms:    Empty state begins fadeOutUp (150ms duration)
150ms:  Empty state fully hidden, results state renders
150ms:  Header begins slideDownFromTop (600ms)
165ms:  Main content begins slideUpFromBottom (750ms)
315ms:  Map begins fadeInUp (525ms)
415ms:  Card 1 begins fadeInUp (525ms)
515ms:  Card 2 begins fadeInUp (525ms)
615ms:  Card 3 begins fadeInUp (525ms)
715ms:  Card 4 begins fadeInUp (525ms)
815ms:  Card 5 begins fadeInUp (525ms)
1150ms: Footer begins fadeIn (600ms)
1750ms: All animations complete
```

---

## Responsive Behavior

### Breakpoints
- **Mobile**: Default (< 1024px)
- **Desktop**: `lg:` prefix (≥ 1024px)

### Layout Changes
1. **Location Selector**: 
   - Mobile: Full width
   - Desktop: `lg:w-1/2 lg:mx-auto` (centered, half-width)

2. **Results Grid**:
   - Mobile: `grid-cols-1` (stacked, map first, then destinations)
   - Desktop: `grid-cols-2` (side-by-side, destinations first, then map)

3. **Map Height**:
   - Mobile: `h-[400px]`
   - Desktop: `h-[600px]` with `lg:sticky lg:top-8`

4. **Typography**:
   - Title: `text-[36px] md:text-[40px]`

---

## Key Implementation Details

### Animation Fill Mode
All animations use `animation-fill-mode: both` to ensure:
- Elements start in their 0% keyframe state (opacity: 0, transformed)
- Elements stay in their 100% keyframe state after animation completes
- No visual "pop" or flash when animations trigger

### Initial Opacity
All animated elements have `opacity: 0` in their CSS class to prevent flash of unstyled content before animation starts.

### State Transition Logic
```typescript
handleLocationSelect(location) {
  setIsExiting(true);           // Trigger exit animation
  setTimeout(() => {
    setSelectedLocation(location); // Switch state after exit completes
    setIsExiting(false);
  }, 150);                       // Match exit animation duration
}
```

### Icons
All icons from **lucide-react**:
- MapPin
- Search
- Edit2
- Sun
- Cloud

### Card Component
Uses shadcn/ui Card component with custom padding and hover effects.

### Button Component
Uses shadcn/ui Button component with variants:
- Primary: Blue background (`bg-blue-600 hover:bg-blue-700`)
- Secondary: Default secondary variant
- Ghost: For edit button

### Input Component
Uses shadcn/ui Input component with:
- Icon positioning: `absolute left-3 top-1/2 -translate-y-1/2`
- Custom background: `bg-input-background`

---

## Important Notes

1. **Empty State Must Not Change**: The empty state layout and styling are finalized and should not be modified.

2. **Transition Smoothness**: The key to smooth transitions is:
   - Exit animation completes before state switch
   - Entrance animations have `animation-fill-mode: both`
   - Initial `opacity: 0` prevents flash

3. **Staggered Delays**: Destination cards use calculated delays: `${0.4 + index * 0.1}s`

4. **Mock Data Only**: All functionality (location detection, search, maps) uses mock data and console.log actions.

5. **Sticky Map**: On desktop, the map uses `lg:sticky lg:top-8` to stay visible while scrolling through destinations.

6. **Typography Inheritance**: The app uses a design system from a grocery shopping app, so custom font sizes (text-[36px], text-[16px], text-[10px]) override default heading styles.

---

## Dependencies

### Required Packages
- React
- lucide-react (for icons)
- shadcn/ui components:
  - Button
  - Card
  - Input

### CSS Framework
- Tailwind CSS v4
- Custom CSS variables in globals.css
- Custom keyframe animations

---

## Testing Checklist

- [ ] Empty state displays correctly with all 4 components
- [ ] Rain animation pulses in sequence (3 rain lines)
- [ ] Sun spins slowly (20s duration)
- [ ] "Use my location" sets location to mock value
- [ ] Search input works with Enter key and Search button
- [ ] Exit animation (150ms) completes before state switch
- [ ] Results state header slides down smoothly
- [ ] Main content slides up with 150ms delay
- [ ] Map appears with 300ms delay
- [ ] 5 destination cards appear with staggered 100ms delays
- [ ] Footer fades in last at 1000ms delay
- [ ] Edit button expands location selector
- [ ] Responsive layout works on mobile and desktop
- [ ] Map is sticky on desktop
- [ ] All animations use proper fill-mode (no flashing)
- [ ] No console errors

---

## Build Instructions for Cursor

1. Create `/App.tsx` as the main entry point with two-state conditional rendering
2. Create all 5 components in `/components/` directory
3. Add all CSS animations and variables to `/styles/globals.css`
4. Import Inter font from Google Fonts
5. Set up Tailwind CSS v4 with custom color tokens
6. Implement state management with `useState` hooks
7. Wire up location selection handler with exit/entrance timing
8. Apply all animations with specified delays and durations
9. Test transition smoothness and responsiveness
10. Verify all animations complete without visual glitches

This specification is complete and ready for implementation.

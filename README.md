# Crypto Onramp POC (Next.js)

A minimal viable demo of a crypto onramp service using Crossmint's Headless Checkout API, implemented as a Next.js app.

## Features

- Simple token purchase flow on Base Sepolia
- Integration with Crossmint's Headless Checkout API
- User authentication via Crossmint (email, Google, Farcaster)
- KYC verification using Persona
- Simulated wallet connection
- Checkout.com payment form integration
- Progress tracking page

## Tech Stack

- **Frontend**: Next.js (React), Tailwind CSS
- **Backend**: Next.js API routes
- **API Integration**: Crossmint Authentication, Crossmint Headless Checkout, Persona, Checkout.com

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd onrampv3
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   # Crossmint API Keys
   NEXT_PUBLIC_CROSSMINT_ENVIRONMENT=staging
   NEXT_PUBLIC_CROSSMINT_API_KEY=YOUR_CROSSMINT_PUBLIC_API_KEY
   CROSSMINT_API_SECRET=YOUR_CROSSMINT_SECRET_API_KEY

   # Checkout.com API Keys
   NEXT_PUBLIC_CHECKOUTCOM_PUBLIC_KEY=YOUR_CHECKOUTCOM_PUBLIC_KEY
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## User Flow

1. User lands on the form page and enters amount of tokens to purchase
2. User clicks "Continue" and is prompted to authenticate using Crossmint
3. After authentication, user confirms email and enters Ethereum wallet address
4. User clicks "Buy Tokens" to create an order via Crossmint's API
5. If KYC is required, the Persona verification flow is launched
6. After KYC approval, Checkout.com payment form is shown
7. After successful payment, completion screen is displayed

## Project Structure

```
/app
  /api
    /create-order       # API route for creating orders
    /get-order-status   # API route for polling KYC status
  /providers
    Providers.tsx       # Authentication providers wrapper
  /progress             # Progress tracking page
  page.tsx              # Main purchase form page
  layout.tsx            # Root layout

/components
  AuthButton.tsx        # Authentication button component
  KYCStatus.tsx         # KYC verification component
  WalletConnectMock.tsx # Simulated wallet connection
  PaymentForm.tsx       # Checkout.com payment form

/lib
  crossmint.ts          # Crossmint API helpers
  utils.ts              # Utility functions including logging utilities
```

## Authentication

The application uses Crossmint's authentication system to provide a seamless user experience:

1. **Authentication Methods**: Users can authenticate using:
   - Email (magic link)
   - Google OAuth
   - Farcaster

2. **Provider Setup**:
   - The app uses `CrossmintProvider` and `CrossmintAuthProvider` from the `@crossmint/client-sdk-react-ui` package
   - Configuration is done in `app/providers/Providers.tsx`

3. **Authentication Flow**:
   - User enters the amount they want to purchase
   - User is prompted to authenticate using one of the available methods
   - After successful authentication, user's email is pre-filled in the form
   - Authenticated state is maintained throughout the app

4. **Implementation Example**:
   ```typescript
   import { useAuth } from '@crossmint/client-sdk-react-ui';
   
   function MyComponent() {
     const { user, login, logout } = useAuth();
     
     // Check if user is authenticated
     if (user) {
       return <div>Welcome, {user.email}!</div>;
     }
     
     // Show login button if not authenticated
     return <button onClick={() => login()}>Login</button>;
   }
   ```

5. **Environment Setup**:
   - To enable authentication, you need to set up a project in the Crossmint developer portal
   - Add your API keys to `.env.local` as shown in the Installation section

## Debug Logging

The application includes a modular logging system for development and debugging purposes:

1. **Global Control**: All debug logging can be enabled/disabled by setting the `DEBUG_ENABLED` flag in `lib/utils.ts`

2. **Namespaced Loggers**: Each module uses its own namespaced logger, making it easy to identify the source of log messages

3. **Usage Example**:
   ```typescript
   import { createLogger } from '@/lib/utils';
   
   // Create a logger with a namespace
   const logger = createLogger('API:EXAMPLE');
   
   // Log info messages with optional data
   logger.log('Operation completed', { id: '123', status: 'success' });
   
   // Log error messages
   logger.error('Operation failed', error);
   ```

4. **Disabling Logs for Production**: Set `DEBUG_ENABLED = false` in `lib/utils.ts` to disable all debug logging

## Important Notes

- This is a demo application and not intended for production use
- For a production implementation, proper security measures should be implemented
- API keys in this demo are using Crossmint's staging environment

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Crossmint OnRamp v3

A streamlined cryptocurrency onramp application built with Next.js and Crossmint API for purchasing USDC.

## Features

- Buy USDC using fiat currency (USD)
- Authentication with Crossmint
- Streamlined checkout flow
- Mobile-responsive design
- Country-specific restrictions
- Wallet integration

## Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_CROSSMINT_API_KEY=your_crossmint_api_key
CROSSMINT_SECRET_KEY=your_crossmint_secret_key
```

## Deployment

This project is configured for easy deployment on Vercel.

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your project on Vercel
3. Vercel will automatically detect Next.js and use the optimal build settings
4. Set your environment variables in the Vercel dashboard
5. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fonrampv3)

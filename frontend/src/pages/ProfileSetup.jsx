import { useNavigate } from 'react-router-dom';
export default function ProfileSetup() {
  const nav = useNavigate();
  // Profile is now set during registration, redirect to booking
  nav('/customer/book');
  return null;
}

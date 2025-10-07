'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Search, Loader2, CheckCircle, Coffee } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserProfile } from './actions';
import SuperCHeader from '../components/header';
import DonationMarquee from '../components/donation-marquee';

export default function SuperCPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitComplete, setSubmitComplete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    phone: '',
    email: '',
    geburtsdatumDay: '',
    geburtsdatumMonth: '',
    geburtsdatumYear: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({}); // Clear previous errors
    setGeneralError(''); // Clear previous general errors

    try {
      const formDataObj = new FormData();
      formDataObj.append('vorname', formData.vorname);
      formDataObj.append('nachname', formData.nachname);
      formDataObj.append('phone', formData.phone);
      formDataObj.append('email', formData.email);
      formDataObj.append('geburtsdatumDay', formData.geburtsdatumDay);
      formDataObj.append('geburtsdatumMonth', formData.geburtsdatumMonth);
      formDataObj.append('geburtsdatumYear', formData.geburtsdatumYear);
      formDataObj.append('preferredLocations', 'superc');
      
      const result = await createUserProfile({}, formDataObj);

      if ('success' in result && result.success) {
        setSubmitComplete(true);
        setFormData({
          vorname: '',
          nachname: '',
          phone: '',
          email: '',
          geburtsdatumDay: '',
          geburtsdatumMonth: '',
          geburtsdatumYear: '',
        });
        
        // Redirect to profile page after a short delay to show success message
        setTimeout(() => {
          router.push('/superc/profile');
        }, 1500);
      } else if ('success' in result && !result.success) {
        // Handle general error message (like duplicate registration)
        setGeneralError(result.message || 'Ein Fehler ist aufgetreten.');
      } else if ('error' in result) {
        console.error('Validation error:', result.error);
        // Handle field-specific validation errors
        if (result.error && typeof result.error === 'object') {
          const fieldErrors: Record<string, string> = {};
          for (const [field, messages] of Object.entries(result.error)) {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[field] = messages[0];
            }
          }
          setErrors(fieldErrors);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setGeneralError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <SuperCHeader />
      
      {/* 感谢打赏者滚动条 */}
      <DonationMarquee />

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">SuperC Anmeldung</h1>
            <p className="text-lg text-gray-600">Füllen Sie das Formular aus, um sich für SuperC zu registrieren</p>
          </div>

          {/* 打赏卡片 */}
          <Card className="mb-8 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Coffee className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  喜欢我们的服务吗？
                </h3>
                <p className="text-gray-600 mb-4">
                  如果您对我们的 SupaC 服务满意，欢迎请我们喝杯咖啡！☕
                </p>
                <Button 
                  asChild
                  variant="outline"
                  className="bg-white hover:bg-orange-50 border-orange-300 text-orange-700 hover:text-orange-800"
                >
                  <a 
                    href="https://www.paypal.com/paypalme/SupaCAachen?locale.x=de_DE&country.x=DE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    请我们喝咖啡
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle>Persönliche Informationen</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitComplete && (
                  <div className="flex items-center text-green-600 bg-green-50 px-4 py-3 rounded-lg">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Anmeldung erfolgreich abgeschickt!</span>
                  </div>
                )}
                
                {generalError && (
                  <div className="flex items-center text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                    <span className="font-medium">{generalError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vorname">Vorname *</Label>
                    <Input
                      id="vorname"
                      name="vorname"
                      type="text"
                      value={formData.vorname}
                      onChange={handleInputChange}
                      required
                      className={errors.vorname ? 'border-red-500' : ''}
                    />
                    {errors.vorname && (
                      <p className="text-sm text-red-600">{errors.vorname}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nachname">Nachname *</Label>
                    <Input
                      id="nachname"
                      name="nachname"
                      type="text"
                      value={formData.nachname}
                      onChange={handleInputChange}
                      required
                      className={errors.nachname ? 'border-red-500' : ''}
                    />
                    {errors.nachname && (
                      <p className="text-sm text-red-600">{errors.nachname}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="beispiel@domain.com"
                    required
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefonnummer * (015712344321)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="015712344321"
                    required
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <Label>Geburtsdatum *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="geburtsdatumDay" className="text-sm">Tag</Label>
                      <Input
                        id="geburtsdatumDay"
                        name="geburtsdatumDay"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.geburtsdatumDay}
                        onChange={handleInputChange}
                        placeholder="DD"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="geburtsdatumMonth" className="text-sm">Monat</Label>
                      <Input
                        id="geburtsdatumMonth"
                        name="geburtsdatumMonth"
                        type="number"
                        min="1"
                        max="12"
                        value={formData.geburtsdatumMonth}
                        onChange={handleInputChange}
                        placeholder="MM"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="geburtsdatumYear" className="text-sm">Jahr</Label>
                      <Input
                        id="geburtsdatumYear"
                        name="geburtsdatumYear"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={formData.geburtsdatumYear}
                        onChange={handleInputChange}
                        placeholder="YYYY"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bevorzugter Standort</Label>
                  <div className="text-sm text-gray-600">SuperC (Standard)</div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    'Anmeldung absenden'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
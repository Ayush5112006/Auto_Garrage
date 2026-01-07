import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const bookingSchema = z.object({
  date: z.date({ required_error: "Please choose a date" }).refine((d) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const chosen = new Date(d); chosen.setHours(0,0,0,0);
    return chosen >= today;
  }, { message: "Date must be today or later" }),
  selectedServices: z.array(z.string()).min(1, "Please choose at least one service"),
  selectedTime: z.string().min(1, "Please choose a time"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone").optional(),
  vehicle: z.string().min(2, "Vehicle info required"),
  notes: z.string().max(500).optional(),
});
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CurrencyToggle from "@/components/ui/currency-toggle";
import InvoiceModal from "@/components/ui/invoice-modal";
import useExchangeRate from "@/hooks/useExchangeRate";
import { convertUSDToINR, formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarDays, Clock, Car, User, Mail, Phone, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const services = [
  { id: "oil-change", name: "Oil Change", price: 49 },
  { id: "engine-repair", name: "Engine Repair", price: 199 },
  { id: "brake-service", name: "Brake Service", price: 89 },
  { id: "car-wash", name: "Car Wash & Detail", price: 29 },
  { id: "ac-service", name: "AC Service", price: 79 },
  { id: "tire-service", name: "Tire Services", price: 39 },
];

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

const Booking = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  type BookingFormValues = z.infer<typeof bookingSchema>;

  const { register, handleSubmit, control, watch, formState: { errors, isValid, isSubmitting } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    mode: 'onChange',
    defaultValues: { date: undefined, selectedServices: [], selectedTime: '', name: '', email: '', phone: '', vehicle: '', notes: '' }
  });

  const watchedServices = (watch('selectedServices') || []) as string[];

  const subtotalUSD = (watchedServices || []).reduce((sum, id) => {
    const s = services.find((x) => x.id === id);
    return sum + (s?.price ?? 0);
  }, 0);



  const onSubmit = (data: BookingFormValues) => {
    setIsSubmitted(true);
    toast({
      title: "Booking Confirmed!",
      description: "You will receive a confirmation email shortly.",
    });
  };


  const { rate, loading: rateLoading } = useExchangeRate();
  const [currency, setCurrency] = useState<'USD'|'INR'>('INR');

  const formattedSubtotalUSD = formatCurrency(subtotalUSD, 'USD');
  const formattedSubtotalConverted = typeof rate === 'number' ? formatCurrency(convertUSDToINR(subtotalUSD, rate), 'INR') : '₹--';

  const selectedItems = watchedServices.map((id) => services.find((s) => s.id === id)!).filter(Boolean).map(s => ({ name: s!.name, price: s!.price }));
  const [showInvoice, setShowInvoice] = useState(false);



  if (isSubmitted) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-32 pb-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-24 h-24 bg-garage-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-garage-success" />
              </div>
              <h1 className="font-display text-4xl text-foreground mb-4">BOOKING CONFIRMED!</h1>
              <p className="text-muted-foreground mb-8">
                Thank you for your booking. We have sent a confirmation email with all the details.
                Our team will contact you shortly to confirm your appointment.
              </p>
              <Button onClick={() => setIsSubmitted(false)}>Book Another Service</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4">

          <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <CurrencyToggle value={currency} onChange={setCurrency} />
              <div className="text-sm text-muted-foreground">
                {rateLoading ? 'Fetching rate...' : rate ? `1 USD = ${rate.toFixed(4)} INR` : 'Rate unavailable'}
              </div>
            </div>

            <span className="text-primary font-medium text-sm uppercase tracking-wider">Online Booking</span>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mt-3 mb-4">
              BOOK YOUR SERVICE
            </h1>
            <p className="text-muted-foreground">
              Schedule your appointment online in just a few clicks. Choose your service,
              pick a date and time that works for you.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid lg:grid-cols-3 gap-8">

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    Select Service
                  </CardTitle>
                  <CardDescription>Choose the service you need</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {services.map((service) => (
                    <label
                      key={service.id}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        watchedServices.includes(service.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          {...register('selectedServices')}
                          value={service.id}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${
                          watchedServices.includes(service.id) ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}>
                          {watchedServices.includes(service.id) && (
                            <div className="w-2 h-2 bg-primary-foreground rounded-sm" />
                          )}
                        </div>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <span className="font-display text-lg text-primary">
                        {currency === 'USD'
                          ? formatCurrency(service.price, 'USD')
                          : rate
                            ? formatCurrency(convertUSDToINR(service.price, rate), 'INR')
                            : '₹--'}
                      </span>
                    </label>
                  ))}

                  {errors.selectedServices && (
                    <p className="text-sm text-destructive mt-1">{errors.selectedServices.message as string}</p>
                  )}
                </CardContent>
              </Card>


              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    Pick Date & Time
                  </CardTitle>
                  <CardDescription>Select your preferred schedule</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Controller
                    control={control}
                    name="date"
                    render={({ field }) => (
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(d) => field.onChange(d)}
                        disabled={(date) => date < new Date() || date.getDay() === 0}
                        className="rounded-xl border"
                      />
                    )}
                  />

                  {errors.date && (
                    <p className="text-sm text-destructive mt-1">{errors.date.message as string}</p>
                  )}

                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-primary" />
                      Select Time
                    </Label>
                    <Controller
                      control={control}
                      name="selectedTime"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a time slot" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />

                    {errors.selectedTime && (
                      <p className="text-sm text-destructive mt-1">{errors.selectedTime.message as string}</p>
                    )}
                  </div>
                </CardContent>
              </Card>


              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Your Information
                  </CardTitle>
                  <CardDescription>Enter your contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="name" placeholder="John Doe" className="pl-10" {...register('name')} />
                    </div>
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message as string}</p>}
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="john@example.com" className="pl-10" {...register('email')} />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message as string}</p> }
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="phone" type="tel" placeholder="(123) 456-7890" className="pl-10" {...register('phone')} />
                      {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message as string}</p> }
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="vehicle">Vehicle Info</Label>
                    <div className="relative mt-1">
                      <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="vehicle" placeholder="2020 Toyota Camry" className="pl-10" {...register('vehicle')} />
                      {errors.vehicle && <p className="text-sm text-destructive mt-1">{errors.vehicle.message as string}</p> }
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any specific issues or requests..."
                      className="mt-1"
                      rows={3}
                      {...register('notes')}
                    />
                    {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes.message as string}</p> }
                  </div>

                  <div className="flex items-center justify-between mt-2 mb-4">
                    <div className="text-sm text-muted-foreground">Subtotal</div>
                    <div className="text-right">
                      <div className="font-display text-lg text-primary">{formattedSubtotalUSD}</div>
                      <div className="text-sm text-muted-foreground">{rate ? `≈ ${formattedSubtotalConverted}` : ''}</div>
                    </div>
                  </div>

                  <div className="flex gap-3 mb-4">
                    <button
                      type="button"
                      className="px-4 py-2 bg-muted rounded disabled:opacity-60"
                      onClick={() => setShowInvoice(true)}
                      disabled={watchedServices.length === 0}
                    >
                      View Bill
                    </button>

                    <Button type="submit" className="flex-1" size="lg" disabled={!isValid || isSubmitting}>
                      Confirm Booking
                    </Button>
                  </div>

                  {showInvoice && (
                    <InvoiceModal
                      open={showInvoice}
                      onClose={() => setShowInvoice(false)}
                      items={selectedItems}
                      subtotalUSD={subtotalUSD}
                      currency={currency}
                      rate={typeof rate === 'number' ? rate : null}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Booking;

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone").optional(),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message should be at least 10 characters"),
});
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Us",
    details: ["123 Garage Street", "Auto City, AC 12345"],
  },
  {
    icon: Phone,
    title: "Call Us",
    details: ["(123) 456-7890", "(123) 456-7891"],
  },
  {
    icon: Mail,
    title: "Email Us",
    details: ["info@autogarage.com", "support@autogarage.com"],
  },
  {
    icon: Clock,
    title: "Working Hours",
    details: ["Mon-Sat: 8AM - 6PM", "Sunday: Closed"],
  },
];

const Contact = () => {
  console.log('Contact component render', new Date().toISOString());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  type ContactFormValues = z.infer<typeof contactSchema>;
  const { register, handleSubmit, formState: { errors, isValid, isSubmitting } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    defaultValues: { name: '', email: '', phone: '', subject: '', message: '' }
  });

  const onSubmit = (data: ContactFormValues) => {
    setIsSubmitted(true);
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">Get In Touch</span>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mt-3 mb-4">
              CONTACT US
            </h1>
            <p className="text-muted-foreground">
              Have questions or need assistance? We're here to help. Reach out to us
              through any of the channels below.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">

            <div className="space-y-6">
              {contactInfo.map((item, index) => (
                <Card key={index}>
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      {item.details.map((detail, i) => (
                        <p key={i} className="text-sm text-muted-foreground">{detail}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>


            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-garage-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-garage-success" />
                    </div>
                    <h3 className="font-display text-2xl text-foreground mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out. We'll respond within 24 hours.
                    </p>
                    <Button onClick={() => setIsSubmitted(false)} variant="outline">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="John Doe" className="mt-1" {...register('name')} />
                        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message as string}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="john@example.com" className="mt-1" {...register('email')} />
                        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message as string}</p>}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" placeholder="(123) 456-7890" className="mt-1" {...register('phone')} />
                        {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message as string}</p>}
                      </div>
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" placeholder="How can we help?" className="mt-1" {...register('subject')} />
                        {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject.message as string}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more about your inquiry..."
                        className="mt-1"
                        rows={6}
                        {...register('message')}
                      />
                      {errors.message && <p className="text-sm text-destructive mt-1">{errors.message.message as string}</p>}
                    </div>

                    <Button type="submit" size="lg" className="w-full md:w-auto" disabled={!isValid || isSubmitting}>
                      <Send className="mr-2 w-5 h-5" />
                      Send Message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>


          <div className="mt-16">
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-2xl">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215!2d-73.9878!3d40.7484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ0JzU0LjIiTiA3M8KwNTknMTYuMSJX!5e0!3m2!1sen!2sus!4v1234567890"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Auto Garage Location"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;

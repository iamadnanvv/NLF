import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Briefcase, Search, Users, Zap, Shield, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

export default function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-24 md:py-36">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.h1
              className="mb-6 text-5xl leading-tight tracking-tight md:text-7xl"
              variants={fadeUp}
            >
              Where talent meets
              <span className="text-primary"> opportunity</span>
            </motion.h1>
            <motion.p
              className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground"
              variants={fadeUp}
            >
              NLF intelligently matches freelancers with projects based on skills, so you spend less time searching and more time doing great work.
            </motion.p>
            <motion.div className="flex flex-col items-center justify-center gap-4 sm:flex-row" variants={fadeUp}>
              <Link to="/auth?tab=signup">
                <Button size="lg" className="gap-2 px-8">
                  <Briefcase className="h-5 w-5" /> Post a Project
                </Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button size="lg" variant="outline" className="gap-2 px-8">
                  <Search className="h-5 w-5" /> Find Work
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
        {/* Decorative gradient */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </section>

      {/* How it works */}
      <section className="border-t bg-secondary/20 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto mb-16 max-w-lg text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="mb-4 text-3xl md:text-4xl">How NLF works</h2>
            <p className="text-muted-foreground">Three simple steps to start collaborating</p>
          </motion.div>

          <motion.div
            className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { step: "01", title: "Create your profile", desc: "Sign up and tell us about your skills or project needs." },
              { step: "02", title: "Get matched", desc: "Our engine matches you with the best-fit projects or freelancers." },
              { step: "03", title: "Start collaborating", desc: "Submit proposals, accept bids, and get work done." },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeUp}>
                <Card className="h-full border-none bg-card shadow-sm">
                  <CardContent className="p-8">
                    <span className="mb-4 inline-block text-4xl font-bold text-primary/20">{item.step}</span>
                    <h3 className="mb-2 text-xl">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto mb-16 max-w-lg text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="mb-4 text-3xl md:text-4xl">Why choose NLF</h2>
          </motion.div>

          <motion.div
            className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { icon: Zap, title: "AI-Powered Matching", desc: "Smart skill-based matching saves you hours of searching." },
              { icon: Shield, title: "Secure & Private", desc: "Your data is protected with enterprise-grade security." },
              { icon: BarChart3, title: "Track Progress", desc: "Monitor proposals, projects, and earnings in one dashboard." },
            ].map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} variants={fadeUp}>
                <Card className="h-full border-none shadow-sm">
                  <CardContent className="p-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="mb-4 text-3xl md:text-4xl">Ready to get started?</h2>
            <p className="mx-auto mb-8 max-w-md text-muted-foreground">
              Join thousands of freelancers and businesses already using NLF.
            </p>
            <Link to="/auth?tab=signup">
              <Button size="lg" className="gap-2">
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

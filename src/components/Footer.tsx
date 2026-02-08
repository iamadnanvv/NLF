import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t bg-secondary/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-xl">Adaline</h3>
            <p className="text-sm text-muted-foreground">
              Connecting talent with opportunity through intelligent matching.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-sm uppercase tracking-wider text-muted-foreground">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/auth?tab=signup" className="hover:text-primary transition-colors">Find Work</Link></li>
              <li><Link to="/auth?tab=signup" className="hover:text-primary transition-colors">Post a Project</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-sm uppercase tracking-wider text-muted-foreground">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-muted-foreground">About</span></li>
              <li><span className="text-muted-foreground">Contact</span></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-sm uppercase tracking-wider text-muted-foreground">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-muted-foreground">Privacy</span></li>
              <li><span className="text-muted-foreground">Terms</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Adaline. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

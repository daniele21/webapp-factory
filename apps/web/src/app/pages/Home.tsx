import { useAuth } from '../providers/AuthProvider'
import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { Page, Card, Button, Skeleton, OAuthButton } from '../components/factory'
import { useAppConfig } from '@config/src/provider'

export default function Home() {
	const { user, loading, login, logout } = useAuth()
	const { config } = useAppConfig()
	const navigate = useNavigate()

	const brandName = useMemo(() => config?.brand?.name ?? 'Webapp Factory', [config])

	return (
		<Page
			title={`Welcome to ${brandName}`}
			description="Use the factory components, runtime config, and FastAPI backend to bootstrap your next product fast."
			actions={
				user ? (
					<Button size="md" variant="outline" onClick={() => navigate('/dashboard')}>
						Go to dashboard
					</Button>
				) : null
			}
		>
			<div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
				<Card
					title="Get started"
					description="Authenticate with the connected provider to unlock protected routes and API calls."
				>
					<div className="space-y-4">
						{loading ? (
							<div className="space-y-3" aria-busy="true">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-10 w-1/2" />
							</div>
						) : user ? (
							<div className="space-y-3">
								<p className="text-sm text-muted-fg">Signed in as</p>
								<p className="text-lg font-semibold text-fg">{user.email}</p>
								<div className="flex flex-wrap gap-2">
									<Button variant="secondary" onClick={() => navigate('/style-demo')}>
										Explore UI library
									</Button>
									<Button variant="outline" onClick={logout}>
										Sign out
									</Button>
								</div>
							</div>
						) : (
							<div className="space-y-3">
								<p className="text-sm text-muted-fg">
									Connect with Google to see the authenticated experience and call secure API endpoints.
								</p>
								<OAuthButton onClick={() => login('google')} fullWidth />
							</div>
						)}
					</div>
				</Card>
				<Card
					title="Next steps"
					description="Hook up your own routes, providers, and deployment workflows."
					elevation="flat"
				>
					<ol className="space-y-2 text-sm text-muted-fg">
						<li>1. Update <code>app.config.json</code> to match your navigation and branding.</li>
						<li>2. Wire new features under <code>apps/web/src/app/features</code> using factory components.</li>
						<li>3. Build FastAPI routes under <code>apps/api/routes</code> and document them via OpenAPI.</li>
						<li>4. Read the README for environment, tooling, and deployment guidance.</li>
					</ol>
				</Card>
			</div>
		</Page>
	)
}

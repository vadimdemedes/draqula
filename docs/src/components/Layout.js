import React from 'react';
import {Link} from 'gatsby';
import {Helmet} from 'react-helmet';
import Container from './Container';
import TopNavigation from './TopNavigation';
import DraqulaLogo from './DraqulaLogo';
import SocialLinks from './SocialLinks';
import SocialLink from './SocialLink';
import GitHubLogo from './GitHubLogo';
import DiscordLogo from './DiscordLogo';
import TwitterLogo from './TwitterLogo';
import Content from './Content';
import Sidebar from './Sidebar';
import Navigation from './Navigation';
import MdxContent from './MdxContent';

const Layout = ({children, pageContext}) => (
	<Container>
		<Helmet>
			<title>{pageContext.frontmatter.title} - Draqula</title>
		</Helmet>

		<TopNavigation>
			<Link to="/">
				<DraqulaLogo />
			</Link>

			<SocialLinks>
				<SocialLink href="https://github.com/vadimdemedes/draqula">
					<GitHubLogo />
				</SocialLink>

				<SocialLink href="https://discord.gg/3Cgrpc4">
					<DiscordLogo />
				</SocialLink>

				<SocialLink href="https://twitter.com/vadimdemedes">
					<TwitterLogo />
				</SocialLink>
			</SocialLinks>
		</TopNavigation>

		<Content>
			<Sidebar>
				<Navigation />
			</Sidebar>

			<MdxContent>{children}</MdxContent>
		</Content>
	</Container>
);

export default Layout;

import React from 'react';
import PropTypes from 'prop-types';
import trimRight from 'trim-right';
import Highlight from 'prism-react-renderer';
import Prism from 'prism-react-renderer/prism';
import theme from 'prism-react-renderer/themes/dracula';

const formatLineNumber = (lineNumber, lines) => {
	const maxNumberOfDigits = String(lines.length).split('').length;
	const currentNumberOfDigits = String(lineNumber).split('').length;

	if (currentNumberOfDigits === maxNumberOfDigits) {
		return lineNumber;
	}

	return lineNumber + ' '.repeat(maxNumberOfDigits - currentNumberOfDigits);
};

const Code = ({className, children}) => {
	const language = className.replace(/language-/, '');
	const code = trimRight(children);

	return (
		<Highlight Prism={Prism} code={code} language={language} theme={theme}>
			{({className, style, tokens, getLineProps, getTokenProps}) => (
				<pre className={`${className} p-4 rounded mb-6 overflow-auto`} style={{...style}}>
					{tokens.map((line, index) => (
						<div key={index} {...getLineProps({line, key: index})}>
							<span className="text-gray-700 mr-4 select-none">{formatLineNumber(index + 1, tokens)}</span>

							{line.map((token, key) => {
								const {style, children, ...tokenProps} = getTokenProps({token, key});

								return (
									<span key={key} {...tokenProps} style={{...style, fontStyle: 'normal'}}>
										{children.replace(/ {4}/g, '  ')}
									</span>
								);
							})}
						</div>
					))}
				</pre>
			)}
		</Highlight>
	);
};

Code.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node
};

export default Code;

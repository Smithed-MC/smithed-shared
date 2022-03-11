import { MarkdownToJSX } from "markdown-to-jsx"

function ModifyiedA(props: any) {
	return (
		<a className="text-lightAccent" href={props.href} target="_blank" rel="noreferrer" title={props.title}>{props.children}</a>
	)
}

export const MarkdownOptions = (wrapper?: React.ElementType<any>): MarkdownToJSX.Options => {
	return {
		wrapper: wrapper,
		forceWrapper: wrapper != null ? true : false,
		overrides: {
			h1: <h1 className="select-none text-text font-[Disket-Bold] text-4xl"></h1>,
			h2: <h2 className="select-none text-subText font-[Disket-Bold] text-3xl"></h2>,
			h3: <h3 className="select-none text-subText font-[Disket-Bold] text-2xl"></h3>,
			a: ModifyiedA,
			hr: <hr className="bg-lightAccent"></hr>,
			span: <span className="text-text font-[Inconsolata]"></span>,
			code: <code className="bg-lightBackground p-1 rounded-md text-codeText"></code>
		}
	}
}

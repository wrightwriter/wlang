// import App from './components/App.svelte'

// const app = new App({
// 	target: document.body,
// 	props: {},
// })

// export default app
function assert(b: boolean) {
	if (!b) {
		debugger
		console.log('ERROR')
	}
}

console.log('amogus')

// var potato = (0+4);
// var amogus = 0;
const script = `
function a(b,c,d){
	var potato = (3+(b*c));
	var amogus = 2;
	var aaaa = (amogus + potato);
	print(potato);
	print(amogus);
	print(aaaa);
}

a(1,4,5);
`

enum LexType {
	definer,
	function,
	name,
	comma,
	value_number,
	value_string,
	bracket_start,
	bracket_end,
	squirly_bracket_start,
	squirly_bracket_end,
	minus,
	plus,
	multiply,
	divide,
	equals,
	line_end,
}

class LexUnit {
	type: LexType
	str: string
	constructor(type: LexType, str: string) {
		this.type = type
		this.str = str
	}
}

class Lexer {
	script: string
	lex_unit: LexUnit[]
	constructor(script: string) {
		this.script = script
		this.lex_unit = []
		this.lex()
	}
	lex() {
		let thing_strs: string[] = []
		let idx = 0

		let curr_unit = ''

		while (idx < script.length) {
			let is_all_spaces = true
			for (let char of curr_unit) {
				// @ts-ignore
				if (char !== ' ' && char !== '\n' && char !== '\t') {
					is_all_spaces = false
				}
			}
			if (is_all_spaces) {
				curr_unit = ''
			}

			let next_tok = script[idx]

			// Delimiters forward
			if (
				next_tok === ' ' ||
				next_tok === '=' ||
				next_tok === ';' ||
				next_tok === ',' ||
				next_tok === '(' ||
				next_tok === ')' ||
				next_tok === '{' ||
				next_tok === '}' ||
				next_tok === '-' ||
				next_tok === '+' ||
				next_tok === '*' ||
				next_tok === '/' ||
				next_tok === '\t' ||
				next_tok === '\n'
			) {
				if (curr_unit) {
					thing_strs.push(curr_unit)
				}
				curr_unit = ''
				// things.push(new Thing(
				// ))
			}
			// Delimiters backward
			if (
				curr_unit === ' ' ||
				curr_unit === '=' ||
				curr_unit === ';' ||
				curr_unit === ',' ||
				curr_unit === '(' ||
				curr_unit === ')' ||
				curr_unit === '{' ||
				curr_unit === '}' ||
				curr_unit === '-' ||
				curr_unit === '+' ||
				curr_unit === '*' ||
				curr_unit === '/' ||
				curr_unit === '\t' ||
				curr_unit === '\n'
			) {
				thing_strs.push(curr_unit)
				curr_unit = ''
			}

			curr_unit += next_tok

			idx++
		}

		// let things: Thing[] = []
		for (let thing_str of thing_strs) {
			let type: LexType
			// @ts-ignore
			if (!isNaN(thing_str)) {
				type = LexType.value_number
			} else if (thing_str === '(') {
				type = LexType.bracket_start
			} else if (thing_str === ')') {
				type = LexType.bracket_end
			} else if (thing_str === '{') {
				type = LexType.squirly_bracket_start
			} else if (thing_str === '}') {
				type = LexType.squirly_bracket_end
			} else if (thing_str === '-') {
				type = LexType.minus
			} else if (thing_str === '+') {
				type = LexType.plus
			} else if (thing_str === '*') {
				type = LexType.multiply
			} else if (thing_str === '/') {
				type = LexType.divide
			} else if (thing_str === '=') {
				type = LexType.equals
			} else if (thing_str === 'var') {
				type = LexType.definer
			} else if (thing_str === 'function') {
				type = LexType.function
			} else if (thing_str === ';') {
				type = LexType.line_end
			} else if (thing_str === ',') {
				type = LexType.comma
			} else {
				type = LexType.name
			}
			this.lex_unit.push(new LexUnit(type, thing_str))
		}
		console.log(this.lex_unit)
	}
}

enum ASTNodeSuperType {
	OP,
	COND,
	OTHER,
}

enum ASTNodeType {
	OP_ADD,
	OP_SUB,
	OP_MUL,
	OP_DIV,
	COND_IF,
	COND_ELSE,
	ASSIGN,
	DEFINE,
	SYMBOL,
	CONSTANT,
	SCOPE,
	FN_DEF,
	FN_AR,
	FN_CALL,
}

class ASTNode {
	type: ASTNodeType
	children: ASTNode[] = []
	value: string | number | null

	push(v: ASTNode) {
		this.children.push(v)
	}
	constructor(type: ASTNodeType, value?: string | number | null) {
		this.type = type
		this.value = value
	}
}

class Parser {
	ast_nodes: ASTNode[] = []
	scope_stack: ASTNode[] = []
	lexer: Lexer
	get curr_scope(): ASTNode {
		return this.scope_stack[this.scope_stack.length - 1]
	}
	// let curr_scope
	constructor(lexer: Lexer) {
		this.lexer = lexer
		this.parse()
		this.print_ast()
	}
	print_ast() {
		function print_node(node: ASTNode, level: number) {
			let log_str = '  '.repeat(level) + ASTNodeType[node.type]
			if (node.value !== undefined) {
				log_str += ' ' + node.value
			}
			console.log(log_str)
			for (let child of node.children) {
				print_node(child, level + 1)
			}
		}
		print_node(this.ast_nodes[0], 0)
	}

	parse() {
		let i = 0

		let scope_stack: ASTNode[] = this.scope_stack

		// global scope
		scope_stack.push(new ASTNode(ASTNodeType.SCOPE))
		this.ast_nodes.push(scope_stack[scope_stack.length - 1])

		for (let i = 0; i < lexer.lex_unit.length; i++) {
			let unit = lexer.lex_unit[i]

			class BracketLevel {
				units: (LexUnit | BracketLevel)[]
				constructor(units: (LexUnit | BracketLevel)[]) {
					this.units = units
				}
			}
			// @ts-ignore
			function get_ast_node(expr: LexUnit | BracketLevel): ASTNode {
				if (expr instanceof BracketLevel) {
					return parse_brack_lev(expr)
				} else {
					if (expr.type === LexType.value_number || expr.type === LexType.value_string) {
						return new ASTNode(ASTNodeType.CONSTANT, expr.type === LexType.value_number ? Number(expr.str) : expr.str)
					} else if (expr.type === LexType.name) {
						return new ASTNode(ASTNodeType.SYMBOL, expr.str)
					} else if (expr.type === LexType.divide) {
						return new ASTNode(ASTNodeType.OP_DIV)
					} else if (expr.type === LexType.multiply) {
						return new ASTNode(ASTNodeType.OP_MUL)
					} else if (expr.type === LexType.minus) {
						return new ASTNode(ASTNodeType.OP_SUB)
					} else if (expr.type === LexType.plus) {
						return new ASTNode(ASTNodeType.OP_ADD)
					}
				}
			}
			function parse_fn_args(fn_def: boolean = false): LexUnit[] {
				let fn_args: LexUnit[] = []

				let arg_idx = 0
				while (lexer.lex_unit[++i].type !== LexType.bracket_end) {
					let arg = lexer.lex_unit[i]
					let should_be_comma = arg_idx % 2 === 1
					assert(should_be_comma ? arg.type === LexType.comma : fn_def ? arg.type === LexType.name : true)
					if (!should_be_comma) {
						fn_args.push(lexer.lex_unit[i])
					}
					arg_idx++
				}
				return fn_args
			}
			function parse_brack_lev(brack_level: BracketLevel): ASTNode {
				if (brack_level.units.length === 1) {
					return get_ast_node(brack_level.units[0])
				} else {
					assert(brack_level.units.length >= 3)
				}
				let root_node: ASTNode = undefined
				let last_ast_node: ASTNode
				for (let i = 0; ; i += 2) {
					let curr = i === 0 ? get_ast_node(brack_level.units[i]) : last_ast_node.children[1]
					let op = get_ast_node(brack_level.units[i + 1])
					let next = get_ast_node(brack_level.units[i + 2])

					let node = op
					if (i > 0) {
						last_ast_node.children[1] = op
						op.children.push(curr)
					} else {
						node.children.push(curr)
					}

					node.children.push(next)
					if (!root_node) {
						root_node = node
					}
					last_ast_node = node
					if (i + 2 >= brack_level.units.length - 1) {
						break
					}
				}
				return root_node
			}

			function parse_rhs_expr(): ASTNode {
				let rhs_expr: LexUnit[] = []

				let next_unit: LexUnit
				while ((next_unit = lexer.lex_unit[++i]).type !== LexType.line_end) {
					rhs_expr.push(next_unit)
				}
				console.log('rhs expr')
				console.log(rhs_expr)

				let bracket_levels: BracketLevel[] = []
				bracket_levels.push(new BracketLevel(rhs_expr))

				let there_are_unrolled_brackets = true
				while (there_are_unrolled_brackets) {
					there_are_unrolled_brackets = false
					for (let lev of bracket_levels) {
						let i = 0
						let brack_start_idx = -100
						let brack_end_idx = -100
						let brack_its = 0
						for (let unit of lev.units) {
							if (unit instanceof LexUnit) {
								// if(brack_start_idx >= 0 && unit.type === LexType.)
								if (unit.type === LexType.bracket_start && brack_start_idx < 0) {
									brack_start_idx = i
								} else if (unit.type === LexType.bracket_end && brack_start_idx >= 0 && brack_its === 0) {
									brack_end_idx = i
									// brack_start_idx = i
								} else if (unit.type === LexType.bracket_start) {
									brack_its++
								} else if (unit.type === LexType.bracket_end) {
									brack_its--
								}
							}
							i++
						}
						assert(!(brack_start_idx >= 0 && brack_its > 0))
						if (brack_start_idx >= 0) {
							there_are_unrolled_brackets = true
							let new_brack_level = new BracketLevel(lev.units.splice(brack_start_idx, brack_end_idx - brack_start_idx + 1))
							lev.units.splice(brack_start_idx, 0, new_brack_level)
							// lev.units[brac]
							new_brack_level.units.splice(0, 1)
							new_brack_level.units.splice(new_brack_level.units.length - 1, 1)
							bracket_levels.push(new_brack_level)
						}
					}
				}
				console.log(bracket_levels)

				let root_lev = bracket_levels[0]
				let rhs_ast = parse_brack_lev(root_lev)
				return rhs_ast
			}

			if (unit.type === LexType.squirly_bracket_end) {
				scope_stack.pop()
			} else if (unit.type === LexType.function) {
				i++
				let fn_name_unit = lexer.lex_unit[i]
				assert(fn_name_unit.type === LexType.name)
				let def_node = new ASTNode(ASTNodeType.DEFINE)
				this.curr_scope.push(def_node)
				def_node.children.push(new ASTNode(ASTNodeType.SYMBOL, fn_name_unit.str))
				let fn_def = new ASTNode(ASTNodeType.FN_DEF)
				def_node.children.push(fn_def)

				i++
				let bracket_a = lexer.lex_unit[i]
				assert(bracket_a.type === LexType.bracket_start)

				let fn_args = parse_fn_args(true)
				for (let arg of fn_args) {
					fn_def.children.push(new ASTNode(ASTNodeType.FN_AR, arg.str))
				}

				assert(lexer.lex_unit[i].type == LexType.bracket_end)
				console.log('fn args')
				console.log(fn_args)
				i++
				assert(lexer.lex_unit[i].type == LexType.squirly_bracket_start)
				let fn_scope = new ASTNode(ASTNodeType.SCOPE)
				scope_stack.push(fn_scope)
				fn_def.children.push(fn_scope)
				// let fn_name_unit = lexer.lex_unit[i]
			} else if (unit.type === LexType.definer) {
				i++
				let fn_name_unit = lexer.lex_unit[i]
				assert(fn_name_unit.type === LexType.name)
				i++
				let fn_eq_unit = lexer.lex_unit[i]
				assert(fn_eq_unit.type === LexType.equals)
				let ast_node = new ASTNode(ASTNodeType.DEFINE)
				ast_node.children.push(new ASTNode(ASTNodeType.SYMBOL, fn_name_unit.str))

				let rhs_ast = parse_rhs_expr()
				ast_node.children.push(rhs_ast)
				this.curr_scope.push(ast_node)
			} else if (unit.type === LexType.name) {
				// i++
				let name_unit = unit
				i++
				let next_unit = lexer.lex_unit[i]
				if (next_unit.type === LexType.equals) {
					// ASSIGNMENT
					// TODO
				} else if (next_unit.type === LexType.bracket_start) {
					// FN CALL
					let bracket_a = next_unit

					let fn_call_ast = new ASTNode(ASTNodeType.FN_CALL)
					fn_call_ast.push(new ASTNode(ASTNodeType.SYMBOL, name_unit.str))
					// def_node.children.push(fn_def)

					let fn_args = parse_fn_args()
					for (let arg of fn_args) {
						// fn_call_ast.children.push(new ASTNode(ASTNodeType.SYMBOL, arg.str))
						fn_call_ast.children.push(get_ast_node(arg))
					}

					assert(lexer.lex_unit[i].type == LexType.bracket_end)

					this.curr_scope.push(fn_call_ast)
					console.log('fn args')
					console.log(fn_args)
				}
				// assert(next_unit.type === LexType.equals)
			}
		}
	}
}

enum ExecutorType {
	number,
	string,
	fn,
}

type VariableValue = string | number | ASTNode
class Variable {
	type: ExecutorType
	value: VariableValue
	name: string
	constructor(type: ExecutorType, name: string, value: VariableValue) {
		this.type = type
		this.value = value
		this.name = name
	}
}

class ExecutorScope {
	variables: Variable[] = []
	pc: number = 0
	ast_node: ASTNode
	constructor(parent: ASTNode) {
		this.ast_node = parent
	}
}

class Executor {
	parser: Parser
	scope_stack: ExecutorScope[] = []
	lexer: Lexer
	get curr_scope(): ExecutorScope {
		return this.scope_stack[this.scope_stack.length - 1]
	}
	constructor(parser: Parser) {
		this.parser = parser
		this.execute()
	}
	execute() {
		let root_node = this.parser.ast_nodes[0]
		this.scope_stack.push(new ExecutorScope(root_node))

		const find_var = (name: string): Variable | null => {
			for (let v of this.curr_scope.variables) {
				if (v.name === name) {
					return v
				}
			}
			return null
		}

		const execute_expr = (node: ASTNode): VariableValue => {
			if (node.type === ASTNodeType.CONSTANT) {
				return node.value
			} else if (node.type === ASTNodeType.SYMBOL) {
				// TODO: add upper scopes
				const v = find_var(node.value as string)
				return v.value
			} else if (
				node.type === ASTNodeType.OP_ADD ||
				node.type === ASTNodeType.OP_SUB ||
				node.type === ASTNodeType.OP_MUL ||
				node.type === ASTNodeType.OP_DIV
			) {
				let a = execute_expr(node.children[0]) as number
				let b = execute_expr(node.children[1]) as number
				let v =
					node.type === ASTNodeType.OP_ADD
						? a + b
						: node.type === ASTNodeType.OP_SUB
						? a - b
						: node.type === ASTNodeType.OP_MUL
						? a * b
						: node.type === ASTNodeType.OP_DIV
						? a / b
						: 0
				return v
				// return a + b
			} else {
				return node
			}
		}
		const execute_scope = (scope: ExecutorScope, params?: (Variable | VariableValue)[]) => {
			let root = scope.ast_node
			if (root.type === ASTNodeType.FN_DEF) {
				let i = 0
				// root.children
				for (let p of params) {
					const par_name = root.children[i].value as string
					if (p instanceof Variable) {
						scope.variables.push(p)
					} else {
						// @ts-ignore
						scope.variables.push(new Variable(isNaN(p) ? ExecutorType.string : ExecutorType.number, par_name, p))
					}
					i++
				}
				root = root.children[root.children.length - 1]
			}
			for (; scope.pc < root.children.length; scope.pc++) {
				let child = root.children[scope.pc]
				if (child.type === ASTNodeType.DEFINE) {
					let name = child.children[0].value as string
					let value_expr = child.children[1]

					let value = execute_expr(value_expr)
					let value_type =
						typeof value === 'string' ? ExecutorType.string : typeof value === 'number' ? ExecutorType.number : ExecutorType.fn
					// let value_type = child.children[1].type
					// if(value_type === ASTNodeType.CONSTANT)
					// if(value_type === ASTNodeType.)
					this.curr_scope.variables.push(new Variable(value_type, name, value))
					// console.log(child)
				} else if (child.type === ASTNodeType.FN_CALL) {
					const fn_name = child.children[0].value as string
					let args: VariableValue[] = []
					for (let i = 1; i < child.children.length; i++) {
						let arg_ast = child.children[i]
						let arg_var = execute_expr(arg_ast)
						args.push(arg_var)
					}
					// console.log('calling fun ' + fn_name)
					// console.log(args)
					if (fn_name === `print`) {
						console.log(args)
					} else {
						const fn = find_var(fn_name)
						assert(!!fn)
						this.scope_stack.push(new ExecutorScope(fn.value as ASTNode))
						execute_scope(this.curr_scope, args)
					}
				}
			}
			console.log(`scope aaa vars`)
			console.log(this.curr_scope.variables)
		}
		execute_scope(this.curr_scope)
		// for(;)
	}
}

const lexer = new Lexer(script)
const parser = new Parser(lexer)
const executor = new Executor(parser)

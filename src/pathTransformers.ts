export interface iPathTransformer {
    (path: string): string
}

export const identity: iPathTransformer = (path: string) => path

export const envPathTransformer: iPathTransformer = (path: string) => path.replace('.', '_').toUpperCase()

export const argPathTransformer: iPathTransformer = (path: string) => path.replace('.', '-')

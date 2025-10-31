import { useAppConfig } from '@config/src/provider'

export const useTransparencyPreference = () => {
	const { config } = useAppConfig()
	return config?.theme?.transparency !== false
}

export default useTransparencyPreference

import { Framework, FrameworkName, FrameworkVersion } from '../../../../domain/models/compliance';

describe('Framework Domain Model', () => {
  it('should create a valid framework', () => {
    // Arrange
    const nameOrError = FrameworkName.create('SOC 2');
    const versionOrError = FrameworkVersion.create('2022');

    expect(nameOrError.isSuccess).toBe(true);
    expect(versionOrError.isSuccess).toBe(true);

    // Act
    const frameworkOrError = Framework.create({
      name: nameOrError.getValue(),
      version: versionOrError.getValue(),
      description: 'SOC 2 Compliance Framework',
      isActive: true
    });

    // Assert
    expect(frameworkOrError.isSuccess).toBe(true);

    const framework = frameworkOrError.getValue();
    expect(framework.name.getValue()).toBe('SOC 2');
    expect(framework.version.getValue()).toBe('2022');
    expect(framework.description).toBe('SOC 2 Compliance Framework');
    expect(framework.isActive).toBe(true);
  });

  it('should reject framework with empty name', () => {
    // Arrange
    const nameOrError = FrameworkName.create('');

    // Assert
    expect(nameOrError.isFailure).toBe(true);
    expect(nameOrError.error).toBe('Framework name cannot be empty');
  });

  it('should reject framework with very long name', () => {
    // Arrange
    const veryLongName = 'a'.repeat(101);
    const nameOrError = FrameworkName.create(veryLongName);

    // Assert
    expect(nameOrError.isFailure).toBe(true);
    expect(nameOrError.error).toBe('Framework name cannot exceed 100 characters');
  });

  it('should activate and deactivate framework', () => {
    // Arrange
    const nameOrError = FrameworkName.create('HIPAA');
    const versionOrError = FrameworkVersion.create('2023');
    const frameworkOrError = Framework.create({
      name: nameOrError.getValue(),
      version: versionOrError.getValue(),
      description: 'HIPAA Compliance Framework',
      isActive: true
    });

    const framework = frameworkOrError.getValue();

    // Act & Assert - Deactivate
    framework.deactivate();
    expect(framework.isActive).toBe(false);

    // Act & Assert - Activate
    framework.activate();
    expect(framework.isActive).toBe(true);
  });

  it('should update framework description', () => {
    // Arrange
    const nameOrError = FrameworkName.create('ISO 27001');
    const versionOrError = FrameworkVersion.create('2022');
    const frameworkOrError = Framework.create({
      name: nameOrError.getValue(),
      version: versionOrError.getValue(),
      description: 'Old description',
      isActive: true
    });

    const framework = frameworkOrError.getValue();

    // Act
    const updateResult = framework.updateDescription('New improved description');

    // Assert
    expect(updateResult.isSuccess).toBe(true);
    expect(framework.description).toBe('New improved description');
  });

  it('should reject empty description update', () => {
    // Arrange
    const nameOrError = FrameworkName.create('ISO 27001');
    const versionOrError = FrameworkVersion.create('2022');
    const frameworkOrError = Framework.create({
      name: nameOrError.getValue(),
      version: versionOrError.getValue(),
      description: 'Original description',
      isActive: true
    });

    const framework = frameworkOrError.getValue();

    // Act
    const updateResult = framework.updateDescription('');

    // Assert
    expect(updateResult.isFailure).toBe(true);
    expect(updateResult.error).toBe('Description cannot be empty');
    expect(framework.description).toBe('Original description'); // Description should not change
  });
});
